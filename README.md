# WhatsApp CRM Chatbot — Backend

An **event-driven, hybrid WhatsApp CRM platform** built with Node.js, Express, PostgreSQL, Redis, and BullMQ.

The platform integrates with the **Meta WhatsApp Cloud API** to manage customer conversations, automate responses using LLMs, deliver product recommendations, and provide operators with complete control over customer communication.

Unlike a traditional chatbot, the system supports **fully automated AI communication, fully manual operator-driven communication, and hybrid operation**, allowing businesses to configure automation at global, group, and individual contact levels.

It combines asynchronous event processing, intelligent message handling, recipient segmentation, product catalog management, targeted broadcasts, and real-time message status tracking into a single backend system.

## Core Capabilities

- **Event-driven messaging architecture** — Webhook-based event ingestion, asynchronous job processing, independent workers, and event-driven message status updates.
- **Hybrid communication modes** — Full AI automation, full manual operation, or a combination of both.
- **Fine-grained recipient management** — Organize contacts into groups and independently configure AI behavior, response delays, system prompts, and reply limits.
- **Intelligent automated replies** — LLM-powered responses with conversation context, configurable prompts, and built-in safety guardrails.
- **Product-aware responses** — Keyword-based product matching, purchase-intent scoring, and automated product media delivery.
- **Inbound message processing** — Text, voice-note transcription, media handling, deduplication, and status tracking.
- **Operator tools** — Manual replies, attachments, conversation history, and individual bot controls.
- **Product catalog** — Categories, products, keywords, and image, video, and audio media.
- **Targeted broadcasts** — Send text and media to all contacts or selected recipient groups.
- **Cost and safety controls** — Per-contact reply caps, configurable response delays, Meta token monitoring, and automatic queue recovery.
- **Analytics** — Message statistics, delivery performance, contact growth, and product-matching insights.
- **Authentication** — JWT access and refresh tokens, session management, and email OTP-based password recovery.

## Architecture

### Event-Driven Hybrid Architecture

The backend follows an event-driven architecture in which incoming WhatsApp events are accepted through webhooks, converted into asynchronous jobs, and processed by dedicated workers.

The API does not need to wait for message processing or AI response generation to complete before acknowledging an incoming webhook.

Redis and BullMQ provide the asynchronous processing infrastructure, while PostgreSQL maintains persistent application and conversation data.

The system supports three operational configurations:

| Mode | Description |
|---|---|
| Full AI Mode | AI handles eligible incoming customer messages and generates automated responses. |
| Full Manual Mode | Automated AI responses are disabled, allowing human operators to manage conversations. |
| Hybrid Mode | AI automation and human-operated communication coexist, with configurable controls over individual contacts and groups. |

The hybrid architecture allows businesses to gradually introduce automation without losing human control over customer interactions.

### High-Level Architecture

```text
                     Meta WhatsApp Cloud API
                       │                 ▲
                Incoming Events     Outgoing Messages
                       │                 ▲
                       ▼                 │
              Express Webhook API       │
                       │                 │
                 Immediate 200           │
                       │                 │
                       ▼                 │
              whatsapp-messages         │
                    Queue                │
                       │                 │
                       ▼                 │
                 whatsAppWorker          │
                       │                 │
          ┌────────────┴────────────┐    │
          │                         │    │
   Incoming Message          Status Update
      Processor                 Processor
          │                         │
          ▼                         ▼
   Contact Management         Message Status
   Deduplication              Tracking
   Voice Transcription
   Bot/Limit Checks
   Reply Generation
          │
          ▼
    Message Records
       (PENDING)
          │
          ▼
    whatsapp-response
         Queue
          │
          ▼
     responseWorker ─────────────────────┘
          │
          ▼
     Meta Graph API


   Operator Dashboard
          │
          ▼
     Express REST API
          │
          ├── Manual Replies
          ├── Attachments
          ├── Broadcasts
          ├── Recipient Management
          ├── Product Catalog
          ├── AI Configuration
          └── Analytics
          │
          ▼
      PostgreSQL

   Redis
     ├── BullMQ Queues
     ├── Delayed Jobs
     ├── Retry Management
     └── OTP Storage
```

Both queue consumers run inside the Express server process. Starting the application with `npm start` starts the API, workers, and token recovery watcher.

## Message Processing Lifecycle

### 1. Webhook Event Ingestion

Meta sends incoming messages and delivery-status events to the backend.

- `GET /webhook` handles Meta's webhook verification handshake.
- `POST /webhook` receives incoming events.
- Events are acknowledged immediately with HTTP 200.
- Individual messages and status updates are added to the `whatsapp-messages` queue.

This separates event ingestion from business logic and prevents potentially expensive processing from blocking webhook responses.

### 2. Asynchronous Event Processing

The `whatsAppWorker` consumes jobs from the incoming-message queue with a concurrency of 5.

It routes events according to their job names:

- `incoming-message` → `processors/incomingMessageProcessor.js`
- `message-status-update` → `processors/statusUpdateProcessor.js`

### 3. Incoming Message Processing

For incoming customer messages, the processor:

1. Validates Meta token availability.
2. Upserts the customer contact.
3. Checks the WhatsApp message ID to prevent duplicate processing.
4. Downloads and transcribes voice notes using Groq Whisper.
5. Determines whether automated replies are enabled for the recipient.
6. Checks applicable message limits.
7. Stores the incoming message in PostgreSQL.
8. Generates an AI response when automation is enabled.
9. Creates outgoing message records with `PENDING` status.
10. Enqueues outgoing messages for asynchronous delivery.

Incoming messages are stored as:

- `PROCESSED` when the bot is permitted to respond.
- `RECEIVED` when automated responses are disabled.

Messages that remain unanswered can subsequently be handled by an operator or processed through the backlog-drain mechanism when automation is re-enabled.

### 4. Asynchronous Response Delivery

The `responseWorker` consumes jobs from the `whatsapp-response` queue with a concurrency of 5.

It handles:

- Text messages.
- Product images and other supported media.
- Operator-generated manual replies.
- Broadcast messages.
- Delayed message delivery.

Messages are sent through the Meta Graph API and their database records are updated with the corresponding WhatsApp message IDs and delivery states.

Subsequent Meta webhook events update message statuses to:

`SENT → DELIVERED → READ`

Failed deliveries are tracked using `FAILED`.

## Hybrid AI and Manual Communication

One of the central architectural features is the ability to control automated communication at multiple levels.

The system is not dependent on AI to function as a CRM. Operators can manage conversations manually, while AI automation can be enabled or disabled according to business requirements.

### Global Controls

- Enable or disable AI-generated responses across the platform.
- Configure a global system prompt.
- Set a default response delay.
- Define the global maximum reply count per contact.

### Group-Level Controls

Each recipient group can have its own:

- AI automation toggle.
- System prompt.
- Response delay.
- Message reply limit.
- Group description and membership.

### Contact-Level Controls

Individual contacts can have:

- Dedicated message limits.
- Configurable limit-reset timestamps.
- Group assignments.
- Conversation history.
- Manual operator communication.

This allows businesses to control automation for specific customers rather than applying a single chatbot configuration to everyone.

### Configuration Priority

| Setting | Configuration |
|---|---|
| AI automation | Group-level setting for grouped contacts; otherwise global setting |
| System prompt | Group prompt → Global prompt → Built-in default |
| Response delay | Group delay → Global delay |
| Message limit | Contact limit → Group limit → Global limit |

The system also supports backlog draining. When AI automation is enabled again, contacts with unanswered `RECEIVED` messages can receive one automated response based on their latest unanswered message, subject to their applicable reply limits.

## Intelligent Reply Generation

Implemented in `services/messageProcessor.js`.

The reply-generation pipeline prioritizes product matching before falling back to general LLM responses.

### 1. Product Keyword Matching

`findProductByKeywordService` searches incoming messages against configured product keywords.

The matching mechanism includes:

- Word-boundary regular expressions.
- Longest-keyword-first matching.
- Purchase-intent scoring.
- Negation detection.
- Complaint and customer-support keyword detection.
- Configurable matching thresholds.

When a suitable product match is identified:

1. The product description is passed to the LLM.
2. The LLM generates a short conversational response.
3. Product media is sent before the generated text.
4. The match is logged in `ProductMatch` without blocking message delivery.

### 2. Context-Aware LLM Responses

When no suitable product matches the incoming message:

- The latest 10 conversation messages are retrieved.
- The system prompt is resolved.
- The LLM generates a context-aware response.

### 3. Prompt Resolution and Guardrails

Prompt resolution follows this priority:

1. Group-specific prompt.
2. Global system prompt.
3. Built-in default prompt.

The resolved prompt is wrapped in hardcoded guardrails that enforce the store-assistant role, restrict inappropriate romantic or sexual personas, and protect internal instructions.

Operator-edited prompts cannot override these hardcoded guardrails.

### 4. Fallback Handling

If LLM response generation fails, the customer receives a generic fallback response instead of the system remaining completely silent.

## Reliability and Background Processing

The backend incorporates several mechanisms to improve reliability and prevent unnecessary message failures.

### Queue Management

Both BullMQ queues use:

- 100 retry attempts.
- Exponential backoff.
- 60-second base backoff delay.
- Retention of the latest 1,000 completed jobs.
- Failed-job retention for troubleshooting.

### Duplicate-Send Protection

Before sending an outgoing message, the response worker checks its existing database status.

Records already marked `SENT`, `DELIVERED`, or `READ` are skipped during retries to reduce duplicate deliveries following partial failures.

### Meta Token Health Monitoring

Implemented through:

- `metaTokenStatusService`
- `tokenRecoveryWatcher`

The system checks token validity against the Meta Graph `/me` endpoint and caches the result for 60 seconds.

When authentication or rate-limit errors occur:

1. Both queues are paused.
2. Jobs remain in Redis.
3. A recovery watcher checks token availability every 30 seconds.
4. Queues resume automatically when the token becomes usable again.

This prevents jobs from continuously failing because of temporary Meta authentication issues.

### Startup Queue Reconciliation

`queueReconciliationService` checks queue states during application startup.

If queues were left paused after a restart, the service rechecks token validity and either resumes processing or restarts the recovery watcher.

### Backlog Recovery

When AI automation is switched back on globally or for a group, the system can process eligible contacts with unanswered incoming messages.

It prioritizes the latest unanswered message per contact and skips contacts that have reached their applicable reply limits.

## Product Catalog Management

The catalog allows businesses to manage products and configure automated product recommendations.

Supported functionality:

- Product categories.
- Product creation, updates, and deletion.
- Product descriptions.
- Multiple keywords per product.
- Product images.
- Product videos.
- Product audio.
- Product media management.
- Keyword-based product matching.

Product matching statistics are persisted in `ProductMatch` and used by the analytics endpoints.

## Recipient and Broadcast Management

The CRM supports managing customer communication at both individual and group levels.

### Recipient Management

- Contact creation and updates through WhatsApp message ingestion.
- Contact grouping and segmentation.
- Group membership management.
- Per-contact automation limits.
- Group-specific AI configuration.
- Individual conversation histories.
- Contact-level message usage tracking.

### Broadcast Management

Operators can create broadcasts using:

- Text messages.
- Media attachments.
- All available contacts.
- Selected recipient groups.

Broadcast messages are processed through the asynchronous response queue, keeping message delivery consistent with the rest of the messaging infrastructure.

## Authentication and Security

The application uses JWT-based authentication with refresh-token session management.

### Access and Refresh Tokens

- Access token validity: 1 hour.
- Refresh token validity: 1 week.
- Refresh tokens are stored in an `httpOnly` cookie.
- Refresh-token sessions are tracked in PostgreSQL.
- Passwords are hashed using bcrypt.

### Password Recovery

The password recovery workflow uses:

1. Email-based OTP generation.
2. Redis-based OTP storage.
3. Five-minute OTP expiration.
4. Brevo email delivery.
5. OTP validation and consumption.

## Technology Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (ESM) |
| API | Express 4 |
| Database | PostgreSQL |
| ORM | Prisma 7 |
| PostgreSQL Adapter | `@prisma/adapter-pg` |
| Queue Management | BullMQ |
| Queue Storage | Redis |
| Redis Client | ioredis |
| LLM Integration | Groq |
| LLM SDK | OpenAI-compatible SDK |
| Voice Transcription | Whisper Large V3 |
| WhatsApp Integration | Meta WhatsApp Cloud API |
| Email Delivery | Brevo |
| Authentication | JWT |
| Password Hashing | bcrypt |
| File Uploads | Multer |
| API Testing | Postman |

## Database Design

The application uses PostgreSQL with Prisma ORM.

| Model | Responsibility |
|---|---|
| `Users` | Operator accounts |
| `Sessions` | Refresh-token session management |
| `Contact` | WhatsApp contacts, group assignment, and individual limits |
| `Groups` | Recipient segmentation and group-specific automation settings |
| `Message` | Incoming and outgoing messages, media, origins, and delivery statuses |
| `Settings` | Global application configuration |
| `Category` | Product catalog categories |
| `Product` | Product information and descriptions |
| `ProductKeyword` | Keywords used for product matching |
| `ProductMedia` | Product images, videos, and audio |
| `ProductMatch` | Product recommendation and matching analytics |

### Message Model

Messages contain several dimensions for tracking communication:

**Direction**
- `INCOMING`
- `OUTGOING`

**Origin**
- `BOT`
- `MANUAL`
- `BROADCAST`

**Status**
- `RECEIVED`
- `PROCESSING`
- `PROCESSED`
- `PENDING`
- `SENT`
- `DELIVERED`
- `READ`
- `FAILED`

This separation allows the application to distinguish between who initiated a message, its direction, and its current delivery state.

### Settings Model

The application maintains a singleton settings record (`id = 1`) containing global configuration, including:

- AI automation toggle.
- Response delay.
- Global system prompt.
- Meta WhatsApp access token.
- Groq API key.
- Global message reply limit.

Meta and Groq credentials can be managed through the settings API without requiring application redeployment.

## REST API Overview

All endpoints are prefixed with `/api/v1`.

Unless explicitly stated otherwise, endpoints require:

`Authorization: Bearer <accessToken>`

| Module | Base Path | Capabilities |
|---|---|---|
| Webhook | `/webhook` | Meta verification and event ingestion |
| Authentication | `/auth` | Registration, login, logout, refresh, password updates, OTP recovery |
| Users | `/users` | Operator listing and deletion |
| Settings | `/settings` | AI configuration, prompts, tokens, response delay, global limits |
| Categories | `/categories` | Category listing, creation, and deletion |
| Products | `/products` | Product CRUD, keywords, media, and description updates |
| Contacts | `/contacts` | Contact listing, chat history, message usage, and individual limits |
| Groups | `/groups` | Group CRUD, members, prompts, delays, limits, and AI controls |
| Messages | `/messages` | Manual text replies and attachment delivery |
| Broadcasts | `/broadcasts` | Text and media broadcasts to all contacts or selected groups |
| Analytics | `/stats/overview` | Message, delivery, contact-growth, and product-match statistics |
| Meta | `/meta/meta-status` | WhatsApp token validity |

### Analytics

`GET /api/v1/stats/overview`

Accepts `from` and `to` date-range parameters in UTC and uses a 60-second cache.

Returns:

- Total incoming and outgoing messages.
- Daily message statistics.
- Delivery, read, and failure rates.
- Message-type breakdown.
- Contact growth.
- Group-wise contact breakdown.
- Total product matches.
- Top-performing products.
- Most frequently matched keywords.

## Project Structure

```text
server.js
│
├── routes/
│   └── Route definitions
│
├── controllers/
│   └── HTTP request handlers
│
├── processors/
│   ├── incomingMessageProcessor.js
│   └── statusUpdateProcessor.js
│
├── workers/
│   ├── whatsAppWorker
│   └── responseWorker
│
├── queues/
│   └── BullMQ queue definitions
│
├── services/
│   ├── Reply generation
│   ├── Product matching
│   ├── Message limits
│   ├── Token health monitoring
│   ├── Queue reconciliation
│   ├── Analytics
│   ├── WhatsApp API integration
│   ├── Email delivery
│   └── Prompt management
│
├── middlewares/
│   ├── JWT authentication
│   ├── OTP validation
│   └── Multer uploaders
│
├── config/
│   ├── Prisma
│   ├── Redis
│   ├── Groq/OpenAI client
│   └── Brevo
│
├── prisma/
│   ├── Schema
│   └── Migrations
│
├── scripts/
│   └── seedSettings.js
│
└── uploads/
    └── Product, chat, and broadcast media
```

## Installation and Setup

### Prerequisites

- Node.js 18+
- PostgreSQL
- Redis
- Meta Developer Account with WhatsApp Cloud API configured
- Groq API key
- Brevo API key
- Public HTTPS URL for webhook integration (ngrok for local development)

### 1. Clone the Repository

```bash
git clone <repository-url>

cd WhatsApp-CRM-Chatbot
```

### 2. Install Dependencies

```bash
npm ci
```

### 3. Configure Environment Variables

```bash
cp example.env .env
```

Configure the required environment variables.

### 4. Run Database Migrations

```bash
npx prisma migrate deploy

npx prisma generate
```

### 5. Seed Initial Settings

```bash
GROQ_API_KEY=<key> node scripts/seedSettings.js
```

This creates the initial singleton settings record (`id = 1`).

### 6. Start the Application

```bash
npm start
```

The application runs on the configured `PORT`, defaulting to `3000`.

## Environment Variables

| Variable | Purpose |
|---|---|
| `PORT` | Express server port |
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_HOST` | Redis hostname |
| `REDIS_PORT` | Redis port |
| `ACCESS_TOKEN` | JWT access-token signing secret |
| `REFRESH_TOKEN` | JWT refresh-token signing secret |
| `FRONTEND_URL` | Allowed frontend CORS origin |
| `PUBLIC_BASE_URL` | Public backend URL for WhatsApp media links |
| `META_WA_VERIFY_TOKEN` | Meta webhook verification token |
| `META_WA_PHONE_NUMBER_ID` | WhatsApp sender phone number ID |
| `OPEN_AI_MODEL` | LLM model name |
| `GROQ_API_KEY` | Groq key used by the settings seeding script |
| `BREVO_API_KEY` | Brevo API key |
| `BREVO_SENDER_NAME` | OTP email sender name |
| `BREVO_SENDER_EMAIL` | OTP email sender address |
| `NODE_ENV` | Application environment |

The Meta access token is stored in the database settings record rather than an environment variable. It can be configured through:

`PATCH /api/v1/settings/set-meta-wa-token`

Keep all credentials and signing secrets out of version control.

## Meta WhatsApp Webhook Configuration

### 1. Expose the Local Server

```bash
ngrok http 3000
```

### 2. Configure Meta Webhook

In the Meta Developer Dashboard:

- Set the callback URL to `https://<host>/api/v1/webhook`.
- Configure the verification token to match `META_WA_VERIFY_TOKEN`.
- Subscribe to the `messages` webhook field.

### 3. Configure the Application

- Register an operator account using `POST /api/v1/auth/register`.
- Authenticate using the login endpoint.
- Configure the Meta access token through the settings API.
- Verify the token status.
- Start receiving WhatsApp events.

The backend must have a publicly accessible HTTPS URL for Meta webhook delivery and outgoing media access.

## Troubleshooting

| Problem | Recommended Check |
|---|---|
| Messages arrive but no replies are sent | Check `/api/v1/meta/meta-status`, AI toggles, applicable reply limits, and queue states |
| Prisma errors | Verify `DATABASE_URL` and run `npx prisma generate` |
| Redis connection errors | Run `redis-cli ping`; expected response: `PONG` |
| Webhook not firing | Check the ngrok tunnel, callback URL, verification token, and Meta subscription |
| Bot silent for a contact | Check contact/group AI settings, global AI settings, and reply limits |
| Messages remain pending | Inspect Redis queue states and response worker logs |
| Product matching not working | Verify product keywords, matching thresholds, and product configuration |
| Media delivery fails | Verify `PUBLIC_BASE_URL`, public accessibility, and Meta media requirements |
| OTP emails not arriving | Verify Brevo API credentials and sender configuration |

## Architectural Highlights

The project brings together several backend engineering concepts:

- Event-driven system design.
- Asynchronous processing with Redis and BullMQ.
- Hybrid AI and human-operated communication.
- Fine-grained recipient and automation management.
- Queue-based message delivery.
- Context-aware LLM integration.
- Product recommendation and keyword scoring.
- Voice-note transcription.
- Idempotent webhook processing.
- Retry and exponential backoff strategies.
- Automatic token recovery.
- Database-backed configuration management.
- JWT-based authentication and session management.
- Message lifecycle and delivery tracking.
- Analytics and operational monitoring.

**The goal is to provide businesses with a flexible WhatsApp CRM where automation is configurable rather than mandatory, operators retain control over customer relationships, and asynchronous processing keeps communication workflows independent of the API request lifecycle.**
