# VoiceFlow — Testing Setup Guide

## Prerequisites

- **Node.js** v18+
- **ngrok** — for exposing your local server to Twilio
- **Twilio Account** with a phone number that supports Voice
- **OpenAI API Key** with access to the Realtime API

---

## 1. Environment Setup

Copy `.env.example` or update your `.env`:

```env
PORT=5001
DATABASE_URL="your_neon_postgres_url"
JWT_SECRET="any_secret_string"
NODE_ENV="development"

# Twilio credentials (from https://console.twilio.com)
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your_real_auth_token"
TWILIO_PHONE_NUMBER="+1234567890"

# OpenAI Realtime API key
OPENAI_API_KEY="sk-xxxxxxxxxxxxxxxxxxxxxxxx"

# Set this to your ngrok URL when testing (updated in step 3)
BASE_URL="http://localhost:5001"
```

---

## 2. Seed Test Data

```bash
cd backend
npm run seed
```

This creates 5 customers, 2 campaigns, 5 bookings, and 3 call logs with sample transcripts.

---

## 3. Expose with ngrok

```bash
# Install ngrok
brew install ngrok   # or download from https://ngrok.com

# Start ngrok tunnel
ngrok http 5001
```

Copy the **Forwarding URL** (e.g., `https://abc123.ngrok-free.app`) and update your `.env`:

```env
BASE_URL="https://abc123.ngrok-free.app"
```

Restart the backend server after updating `.env`.

---

## 4. Configure Twilio

1. Go to [Twilio Console → Phone Numbers](https://console.twilio.com/us1/develop/phone-numbers/manage/incoming)
2. Click your phone number
3. Under **Voice Configuration**:
   - **A Call Comes In**: `Webhook`
   - **URL**: `https://abc123.ngrok-free.app/voice/incoming`
   - **HTTP Method**: `POST`
4. Under **Status Callback**:
   - **URL**: `https://abc123.ngrok-free.app/webhooks/twilio`
   - **HTTP Method**: `POST`
5. Click **Save Configuration**

---

## 5. Test Inbound Calls

1. Call your Twilio phone number from any phone
2. You should hear the AI greet you
3. Try saying: *"What's the status of my appointment?"*
4. Check the backend terminal for logs:
   ```
   [Twilio] Media stream connected
   [OpenAI] Connected to Realtime API
   [Twilio] Stream started: MZxxxxxxxxxx
   [Tool Call] check_booking_status { phone: '+1...' }
   ```
5. After hanging up, check `localhost:3000/call-logs` — the transcript should appear

---

## 6. Test Outbound Campaign Calls

```bash
# Start a campaign via API
curl -X POST http://localhost:5001/campaigns/{campaignId}/start
```

The campaign will iterate over its pending bookings and call each customer using the AI.

---

## 7. Verify Tool Calling

During a call, test these phrases:

| What to say                                      | Expected AI action                        |
|--------------------------------------------------|-------------------------------------------|
| "What's my appointment status?"                   | Calls `check_booking_status`              |
| "Can you reschedule to next Friday at 3 PM?"     | Calls `reschedule_booking`                |
| "I need to cancel my appointment"                 | Calls `cancel_booking`                    |

Check the database after each call:
```bash
# Check bookings
curl http://localhost:5001/bookings | jq

# Check call logs
curl http://localhost:5001/call-logs | jq
```

---

## Troubleshooting

| Issue                          | Solution                                           |
|--------------------------------|----------------------------------------------------|
| AI doesn't respond             | Check `OPENAI_API_KEY` is set and valid             |
| Twilio returns 502             | Ensure ngrok is running and `BASE_URL` is updated   |
| No transcript saved            | Check that the call SID matches a CallLog entry     |
| WebSocket not connecting       | Verify ngrok URL uses `wss://` (not `ws://`)        |
