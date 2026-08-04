# WhatsApp Bot Backend - Local Setup

This guide explains how to set up and run the WhatsApp Bot backend locally.

## Prerequisites

Make sure the following are installed:

- Node.js >= 18
- PostgreSQL
- Redis
- Git
- Ngrok

Check versions:

```bash
node -v
psql --version
redis-server --version
ngrok version
```

## 1. Clone Repository

```bash
git clone <repository-url>
cd WhatsApp-CRM-Chatbot
```

## 2. Install Dependencies

```bash
npm ci
```

## 3. Environment Variables Setup

An `example.env` file is included in the project with all the required environment variables.

Copy it to a new `.env` file:

After copying, update the values in `.env` with your local configuration, such as:

- PostgreSQL database credentials
- WhatsApp Cloud API access token
- Phone Number ID
- Webhook verification token
- Any other required secrets

## 4. Setup PostgreSQL Database

1. Open **pgAdmin 4** and connect to your local PostgreSQL server.

2. Create a new database named:

```text
whatsapp-crm-chatbot
```

3. Update the `DATABASE_URL` in your `.env` file to point to the newly created database.

Example:

```env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/whatsapp-crm-chatbot"
```

4. Apply the existing Prisma migrations:

```bash
npx prisma migrate deploy
```

5. Generate the Prisma Client:

```bash
npx prisma generate
```

After these steps, your local database schema will match the project's latest schema.

## 5. Start Redis

Start Redis locally:

```bash
redis-server
```

Verify Redis is running:

```bash
redis-cli ping
```

Expected output:

```
PONG
```

## 6. Run Backend Server

Start the development server:

```bash
npm run dev
```

Backend will run on:

```text
http://localhost:3000
```

The BullMQ worker is integrated within the server process, so it will automatically start when the backend server starts.

The server handles:

- WhatsApp webhook requests
- Queue processing through BullMQ
- Background message handling
- Database operations through Prisma

## 8. Setup WhatsApp Webhook Locally

Meta requires a public HTTPS URL to send webhook events. For local development, use **ngrok**.

### Start ngrok

Open Command Prompt and run:

```bash
ngrok http 3000
```

Copy the generated HTTPS URL:

Example:

```text
https://xxxx.ngrok.io
```

Your webhook URL will be:

```text
https://xxxx.ngrok.io/api/v1/webhook
```

Configure this URL in the Meta WhatsApp Developer Dashboard.

---

### Webhook Verification

Meta will send a verification request when setting up the webhook.

Example:

```
https://xxxx.ngrok.io/api/v1/webhook?hub.mode=subscribe&hub.verify_token=your_verify_token&hub.challenge=12345
```

Make sure:

- `hub.verify_token` matches `META_WA_VERIFY_TOKEN` in your `.env` file.
- Backend server is running.
- ngrok tunnel is active.

---

### Test Incoming WhatsApp Message

After webhook verification, Meta will send message events to:

```
POST /api/v1/webhook
```

Example payload:

```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "WHATSAPP_BUSINESS_ACCOUNT_ID",
      "changes": [
        {
          "field": "messages",
          "value": {
            "messaging_product": "whatsapp",
            "messages": [
              {
                "from": "923001234567",
                "id": "wamid.test123",
                "timestamp": "1720000000",
                "type": "text",
                "text": {
                  "body": "Hello bot"
                }
              }
            ]
          }
        }
      ]
    }
  ]
}
```

---

## Running Services

You need the following services running:

1. **PostgreSQL**

```bash
postgres
```

2. **Redis**

```bash
redis-server
```

3. **Backend Server (includes BullMQ worker)**

```bash
npm run dev
```

The backend process handles:

- WhatsApp webhook requests
- BullMQ queue processing
- Background message handling
- Database operations

---

## Troubleshooting

### Prisma Database Error

Run:

```bash
npx prisma generate
```

Also verify your `DATABASE_URL` is correct.

---

### Redis Connection Error

Check Redis status:

```bash
redis-cli ping
```

Expected:

```text
PONG
```

If Redis is not running:

```bash
redis-server
```

---

### Webhook Not Receiving Messages

Check:

- ngrok URL is active
- Callback URL is:
  ```
  https://xxxx.ngrok.io/api/v1/webhook
  ```
- Verification token matches `.env`
- Backend server is running on port `3000`

---

## Project Flow

```
WhatsApp Cloud API
        |
        v
    Webhook API
        |
        v
   BullMQ Queue
        |
        v
 Server Worker Process
        |
        v
    PostgreSQL
```

Flow summary:

**Receive → Queue → Process**

**Prisma Database Error**

Run:

```bash
npx prisma generate
```

and verify your `DATABASE_URL`.

**Redis Connection Error**

Check Redis status:

```bash
redis-cli ping
```

If Redis is not running:

```bash
redis-server
```

**Webhook Not Receiving Messages**

Check:

- ngrok URL is active
- Callback URL is correct
- Verify token matches `.env`
- Backend server is running
