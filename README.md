# WhatsApp Cloud API Bot (Node.js + Express)

A minimal server that receives WhatsApp messages via Meta's webhook and sends replies
using the Graph API — no third-party automation tool required.

## 1. Install dependencies

```bash
npm install
```

## 2. Configure credentials

```bash
cp .env.example .env
```

Then fill in `.env`:

| Variable | Where to find it |
|---|---|
| `VERIFY_TOKEN` | You make this up — any string. Must match what you type into Meta's "Verification identifier" field. |
| `WHATSAPP_TOKEN` | Meta App Dashboard → WhatsApp → API Setup → "Temporary access token" (for testing) or a permanent System User token (for production). |
| `PHONE_NUMBER_ID` | Meta App Dashboard → WhatsApp → API Setup, or WhatsApp Manager → Phone numbers → click your number → "Phone number ID". |

## 3. Run the server locally

```bash
npm start
```

You should see:
```
🚀 Server listening on port 3000
```

## 4. Expose it with ngrok

In a separate terminal:

```bash
ngrok http 3000
```

Copy the `https://xxxx.ngrok-free.app` URL it gives you.

⚠️ **Free ngrok URLs change every time you restart ngrok.** Each time that happens,
you must go back to Meta and re-verify the webhook with the new URL (step 5).

## 5. Register the webhook with Meta

Go to: **Meta App Dashboard → WhatsApp → Configuration → Webhook**

- **Callback URL**: `https://xxxx.ngrok-free.app/webhook`
- **Verify token**: same value as `VERIFY_TOKEN` in your `.env`
- Click **Verify and save**

If your server is running and the token matches, this succeeds instantly — you'll see
`✅ Webhook verified successfully` in your terminal.

Then scroll down to **Webhook fields** and toggle **Subscribe** for `messages`.

## 6. Test it

Send a WhatsApp message to your registered business number from your personal phone.
Your terminal should log:

```
📩 Message from 923xxxxxxxxx (text): hello
📤 Sent reply to 923xxxxxxxxx
```

And you should get an auto-reply back in WhatsApp within a second or two.

## Notes on the code

- `server.js` has three parts: **GET /webhook** (one-time verification), **POST /webhook**
  (fires on every incoming message/status update), and `sendMessage()` (calls the Graph
  API to send a reply).
- The POST handler responds `200` immediately before processing — Meta expects a fast
  response and will disable your webhook if it times out or errors repeatedly.
- `value.messages` is only present for actual incoming messages. Status updates
  (sent/delivered/read receipts) come through the same endpoint with a different shape
  (`value.statuses` instead) — this code currently ignores those; add handling if you need it.
- Access tokens from "API Setup" in the dashboard expire in 24 hours. For anything
  beyond testing, generate a permanent token via a System User in Meta Business Settings.

## Common issues

- **"Callback URL couldn't be validated"** → server isn't running, ngrok isn't running,
  or `VERIFY_TOKEN` in `.env` doesn't exactly match what you typed into Meta.
- **Webhook verifies but no messages arrive** → check that `messages` is toggled
  **Subscribed** under Webhook fields (this can silently un-subscribe if the callback
  URL changes without re-saving).
- **ngrok URL stopped working** → free ngrok URLs reset on every restart; re-verify in
  Meta with the new URL each time, or get a paid ngrok static domain to avoid this.
