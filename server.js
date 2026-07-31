require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const axios = require('axios');
const FormData = require('form-data');
const OpenAI = require('openai');

const app = express();
app.use(express.json());

const {
  VERIFY_TOKEN,
  WHATSAPP_TOKEN,
  PHONE_NUMBER_ID,
  GRAPH_API_VERSION = 'v23.0',
  OPENAI_API_KEY,
  OPENAI_MODEL = 'gpt-4o-mini',
  PORT = 3000,
} = process.env;

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// Single source of truth for the Graph API base URL — every send/upload call
// below builds off this instead of repeating the template string.
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}/${PHONE_NUMBER_ID}`;
const GRAPH_HEADERS_JSON = { Authorization: `Bearer ${WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' };

// WhatsApp's native voice-note bubble (play icon + waveform) only renders if
// the .ogg/Opus file is 512KB or smaller. Above that, WhatsApp silently
// falls back to a plain download-icon attachment — same voice:true flag,
// worse UX. We warn in the logs so this doesn't go unnoticed in testing.
const VOICE_NOTE_MAX_BYTES = 512 * 1024;

// ---------------------------------------------------------------------------
// PRODUCT / SALES CONFIG — edit this block for your actual product
// ---------------------------------------------------------------------------
const PRODUCT_NAME = 'YOUR PRODUCT NAME HERE';
const PRODUCT_DETAILS = `
- What it does: [describe the product/service]
- Price: [e.g. PKR 4,999]
- Key benefits: [2-3 bullet points]
- Delivery/availability: [e.g. ships in 3 days, available in Rawalpindi/Islamabad]
- How to order: [e.g. reply YES and we'll confirm your address]
`;

const SYSTEM_PROMPT = `You are a friendly, helpful WhatsApp sales assistant for "${PRODUCT_NAME}".

Product details:
${PRODUCT_DETAILS}

Your goals, in order of priority:
1. Sound like a real, warm, conversational human — not a corporate bot. Keep replies short (2-4 sentences), casual, and natural for WhatsApp chat.
2. Answer the customer's actual question first, honestly and accurately based on the product details above. Never invent details not listed above — if you don't know something, say you'll check and get back to them.
3. Where it fits naturally, highlight a genuine benefit and gently guide the conversation toward making a purchase — without being pushy, repetitive, or dishonest. No fake urgency, no manipulative pressure tactics, no false scarcity claims.
4. If the customer says no, is annoyed, or asks to stop, respect that immediately and back off.
5. If they ask something totally unrelated to the product, respond helpfully as a normal, general-purpose assistant — then naturally return to the product only if it fits.

Never claim to be human if directly asked — you can say you're the store's WhatsApp assistant.`;

// ---------------------------------------------------------------------------
// Keyword triggers — checked before falling through to the LLM. Add more
// entries here rather than stacking additional if/else blocks in the
// webhook handler as this grows.
// ---------------------------------------------------------------------------
const TRIGGERS = {
  hello: { type: 'voice', path: './audio/hello.ogg' },
  photo: { type: 'image', path: './images/photo.jpg' },
};

// In-memory conversation history per user (resets on server restart).
// For production, replace with a real database (e.g. Postgres) so history
// survives restarts and works across multiple server instances.
const conversations = new Map();

function getHistory(userId) {
  if (!conversations.has(userId)) {
    conversations.set(userId, [{ role: 'system', content: SYSTEM_PROMPT }]);
  }
  return conversations.get(userId);
}

// ---------------------------------------------------------------------------
// 1. WEBHOOK VERIFICATION (GET) — one-time handshake when registering the
//    Callback URL in Meta's dashboard.
// ---------------------------------------------------------------------------
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Webhook verified');
    return res.status(200).send(challenge);
  }

  console.log('❌ Webhook verification failed — token mismatch');
  res.sendStatus(403);
});

// ---------------------------------------------------------------------------
// 2. RECEIVE MESSAGES (POST) — fires on every incoming message and on every
//    delivery status update (sent/delivered/read/failed) for messages we sent.
// ---------------------------------------------------------------------------
app.post('/webhook', async (req, res) => {
  res.sendStatus(200); // ack immediately — Meta expects a fast response

  try {
    const value = req.body.entry?.[0]?.changes?.[0]?.value;
    const message = value?.messages?.[0];

    if (!message) {
      logStatusUpdate(value?.statuses?.[0]);
      return;
    }

    await handleIncomingMessage(message);
  } catch (err) {
    console.error('Error handling webhook payload:', err.response?.data || err.message);
  }
});

function logStatusUpdate(status) {
  if (!status) return;

  console.log(`📶 Status update — id:${status.id} status:${status.status}`);

  if (status.status === 'failed') {
    console.log('❌ Delivery failed. Details:', JSON.stringify(status.errors));
  }
}

async function handleIncomingMessage(message) {
  const from = message.from;
  const msgType = message.type;
  const text = message.text?.body;

  console.log(`📩 ${from} (${msgType}): ${text ?? '[non-text]'}`);

  if (msgType !== 'text') {
    await sendTextMessage(from, "I can only read text messages right now — mind typing that out?");
    return;
  }

  const trigger = TRIGGERS[text.trim().toLowerCase()];
  if (trigger) {
    await handleTrigger(from, trigger);
    return;
  }

  const reply = await getAIReply(from, text);
  await sendTextMessage(from, reply);
}

async function handleTrigger(to, trigger) {
  if (!fs.existsSync(trigger.path)) {
    console.error(`❌ Trigger file missing on disk: ${trigger.path}`);
    await sendTextMessage(to, "Sorry, something's misconfigured on our end — I'll flag it.");
    return;
  }

  if (trigger.type === 'voice') {
    await sendVoiceMessageFromFile(to, trigger.path);
  } else if (trigger.type === 'image') {
    await sendImageMessageFromFile(to, trigger.path);
  }
}

// ---------------------------------------------------------------------------
// 3. LLM REPLY — maintains per-user conversation history
// ---------------------------------------------------------------------------
async function getAIReply(userId, userText) {
  const history = getHistory(userId);
  history.push({ role: 'user', content: userText });

  // Keep history bounded — system prompt + last 20 turns
  if (history.length > 21) {
    history.splice(1, history.length - 21);
  }

  const completion = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    messages: history,
    temperature: 0.7,
    max_tokens: 300,
  });

  const reply = completion.choices[0].message.content.trim();
  history.push({ role: 'assistant', content: reply });

  return reply;
}

// ---------------------------------------------------------------------------
// 4. SEND TEXT MESSAGE
// ---------------------------------------------------------------------------
async function sendTextMessage(to, body) {
  await axios.post(
    `${GRAPH_BASE}/messages`,
    { messaging_product: 'whatsapp', to, type: 'text', text: { body } },
    { headers: GRAPH_HEADERS_JSON }
  );

  console.log(`📤 Sent text to ${to}: ${body}`);
}

// ---------------------------------------------------------------------------
// 5. MEDIA UPLOAD — shared by voice and image sends
// ---------------------------------------------------------------------------
async function uploadMedia(filePath, mimeType) {
  const form = new FormData();
  form.append('messaging_product', 'whatsapp');
  form.append('file', fs.createReadStream(filePath), { contentType: mimeType });

  const res = await axios.post(`${GRAPH_BASE}/media`, form, {
    headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}`, ...form.getHeaders() },
  });

  if (!res.data.id) {
    throw new Error(`Upload succeeded but no media id returned: ${JSON.stringify(res.data)}`);
  }

  return res.data.id;
}

// ---------------------------------------------------------------------------
// 6. SEND VOICE MESSAGE
//    Requires .ogg/Opus for native voice-note rendering. File must be
//    ≤512KB or WhatsApp silently downgrades to a plain audio attachment.
// ---------------------------------------------------------------------------
async function sendVoiceMessageFromFile(to, filePath, mimeType = 'audio/ogg') {
  const sizeBytes = fs.statSync(filePath).size;
  if (sizeBytes > VOICE_NOTE_MAX_BYTES) {
    console.warn(
      `⚠️  ${filePath} is ${(sizeBytes / 1024).toFixed(0)}KB — over the 512KB voice-note limit. ` +
      `WhatsApp will deliver this as a regular audio attachment, not a native voice bubble.`
    );
  }

  const mediaId = await uploadMedia(filePath, mimeType);

  const res = await axios.post(
    `${GRAPH_BASE}/messages`,
    { messaging_product: 'whatsapp', to, type: 'audio', audio: { id: mediaId, voice: true } },
    { headers: GRAPH_HEADERS_JSON }
  );

  console.log('📤 Voice send response:', JSON.stringify(res.data));
}

// Alternative: send audio already hosted at a public URL, skipping upload.
async function sendVoiceMessageFromUrl(to, audioUrl) {
  await axios.post(
    `${GRAPH_BASE}/messages`,
    { messaging_product: 'whatsapp', to, type: 'audio', audio: { link: audioUrl, voice: true } },
    { headers: GRAPH_HEADERS_JSON }
  );

  console.log(`📤 Sent voice message (via URL) to ${to}`);
}

// ---------------------------------------------------------------------------
// 7. SEND IMAGE MESSAGE
// ---------------------------------------------------------------------------
async function sendImageMessageFromFile(to, filePath, mimeType = 'image/jpeg') {
  const mediaId = await uploadMedia(filePath, mimeType);

  const res = await axios.post(
    `${GRAPH_BASE}/messages`,
    { messaging_product: 'whatsapp', to, type: 'image', image: { id: mediaId } },
    { headers: GRAPH_HEADERS_JSON }
  );

  console.log('📤 Image send response:', JSON.stringify(res.data));
}

// ---------------------------------------------------------------------------
app.get('/', (req, res) => res.send('WhatsApp bot server is running.'));

app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});