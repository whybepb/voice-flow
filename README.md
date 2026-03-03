# Automated Voice Agent

Production-ready multi-tenant voice automation platform with campaign calling, realtime AI conversations, RAG knowledge search, and post-call analytics.

## What This Project Does

This system lets each business account:
- onboard with its own Twilio and OpenAI credentials,
- upload business documents for RAG,
- launch outbound call campaigns,
- handle realtime call conversations with an AI voice agent,
- save transcripts and generate post-call summaries/action items.

All data access is tenant-scoped (`userId`) to keep account data isolated.

## Architecture

### Services
- `dashboard/`: Next.js frontend (operator dashboard)
- `backend/`: Express API + WebSocket server for Twilio Media Streams
- `PostgreSQL (Neon)`: transactional data + `pgvector` for embeddings

### External Integrations
- Twilio Voice + Media Streams for telephony
- OpenAI Realtime API for voice conversation
- OpenAI embeddings for knowledge search
- OpenAI chat completions for post-call analysis

### Core Runtime Flow
1. User creates campaign from dashboard.
2. Backend queues outbound call jobs.
3. Twilio calls `/voice/outbound` and opens stream to `/media-stream`.
4. Backend bridges Twilio audio <-> OpenAI Realtime.
5. Tool calls can access bookings and RAG search within tenant scope.
6. Transcript is stored and post-call analysis is queued.

## Features

- Multi-tenant isolation across customers, bookings, campaigns, call logs, and knowledge docs.
- Campaign operations: create, start, booking assignment, status tracking.
- RAG pipeline:
  - upload `PDF/TXT`,
  - extract text,
  - chunk + embed,
  - vector similarity search with citations.
- Realtime call assistant with tool execution:
  - check booking status,
  - reschedule/cancel booking,
  - search knowledge base.
- Post-call AI analysis:
  - summary,
  - sentiment,
  - action items.
- CSV audience import with E.164 normalization and invalid-row reporting.
- Background jobs with retry/backoff and status history.

## Security Model

- Per-user provider credentials (no shared runtime OpenAI/Twilio keys).
- Secrets encrypted at rest (`SECRET_ENCRYPTION_KEY`).
- Twilio request signature verification on webhook and voice routes.
- Redacted credential metadata in API responses.
- Production guard blocks startup if encryption key is missing.

## Repository Layout

```text
.
├── backend/
│   ├── prisma/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── tests/integration/
│   │   └── utils/
│   └── PRODUCTION_DEPLOY_CHECKLIST.md
└── dashboard/
    └── src/
```

## Prerequisites

- Node.js 20+ (22 recommended)
- npm 10+
- PostgreSQL 14+ with `pgvector` support (Neon works)
- Twilio account + number
- OpenAI API access
- (Optional) Google OAuth client for Google login

## Local Development

### Backend

```bash
cd backend
npm ci
npx prisma generate
npx prisma db push
npm run dev
```

### Frontend

```bash
cd dashboard
npm ci
npm run dev
```

## Environment Variables

### Backend (`backend`)

| Key | Required | Example | Notes |
|---|---|---|---|
| `DATABASE_URL` | Yes | `postgresql://...` | Neon/Postgres connection string |
| `JWT_SECRET` | Yes | `long-random-secret` | Rotate if leaked |
| `SECRET_ENCRYPTION_KEY` | Yes (prod) | `openssl rand -hex 32` output | Required for encrypted credential storage |
| `NODE_ENV` | Yes | `production` | Must be `production` in deploy |
| `BASE_URL` | Yes | `https://voiceapp.whybepb.site` | Must include `https://` |
| `TWILIO_SIGNATURE_VALIDATION` | Yes | `true` | Keep enabled in production |
| `ALLOW_PLAINTEXT_SECRETS` | Yes | `false` | Keep `false` in production |
| `GOOGLE_CLIENT_ID` | Optional | `xxx.apps.googleusercontent.com` | Needed only if `/auth/google` is enabled |
| `PORT` | Optional | `5001` | Render injects this automatically |

Important:
- Do **not** set global runtime `OPENAI_API_KEY` / `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` for app logic. Provider creds are per user.

### Frontend (`dashboard`)

| Key | Required | Example | Notes |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | Yes | `https://voiceapp.whybepb.site` | Backend public URL |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Optional | `xxx.apps.googleusercontent.com` | Needed for Google login button |

## Backend Scripts

From `backend/`:

```bash
npm run dev                 # local API + websocket
npm run build               # typescript build
npm run start               # run compiled server
npm run db:push             # schema sync (dev)
npm run db:migrate          # migration deploy (prod)
npm run db:baseline:resolve # mark baseline as applied on existing DB
npm run secrets:encrypt     # one-time re-encrypt existing plaintext secrets
npm test                    # integration tests
```

## Deployment Guide

### Backend (Render)

Service settings:
- Environment: `Node`
- Root Directory: `backend`
- Build Command: `npm ci --include=dev && npm run build`
- Start Command: `npm run start`

Post-deploy:
```bash
npm run db:migrate
npm run secrets:encrypt
```

### Frontend (Vercel)

- Deploy `dashboard` project.
- Set `NEXT_PUBLIC_API_URL` to backend domain.
- Set `NEXT_PUBLIC_GOOGLE_CLIENT_ID` if Google login is enabled.
- Redeploy after changing any `NEXT_PUBLIC_*` env variable.

## Twilio Setup

Use backend URLs:
- Incoming voice: `POST https://<backend-domain>/voice/incoming`
- Status callback: `POST https://<backend-domain>/webhooks/twilio`

Notes:
- Use full absolute URLs (`https://...`).
- If using custom domain, verify DNS + SSL before testing calls.

## Google OAuth Setup

In Google Cloud Console OAuth client:
- Add Authorized JavaScript origins:
  - `https://<frontend-domain>`
  - `https://<your-vercel-preview-or-prod-domain>`
- Do not include paths or trailing slashes.

## API Surface (High Level)

- `POST /auth/register`, `POST /auth/login`, `POST /auth/google`
- `GET /auth/me`, `PATCH /auth/onboarding`, `PATCH /auth/settings`
- `GET/POST /customers`
- `GET/POST /bookings`, `PATCH /bookings/:id/status`
- `GET/POST /campaigns`, `POST /campaigns/:id/start`
- `GET /call-logs`, `GET /call-logs/:id`
- `POST /knowledge/upload`, `GET /knowledge`, `DELETE /knowledge/:id`
- `POST /knowledge/:id/reindex`, `POST /knowledge/query`
- `GET /jobs`
- `POST /voice/incoming`, `POST /voice/outbound`
- `POST /webhooks/twilio`

## Testing

Integration tests cover:
- auth and onboarding,
- campaign create/start flow,
- knowledge upload/query,
- tenant isolation behavior.

Run:

```bash
cd backend
npm test
```

## Troubleshooting

- Twilio error `21205 Url is not a valid URL`:
  - fix `BASE_URL` to include `https://`.
- Startup crash `SECRET_ENCRYPTION_KEY is required`:
  - set `SECRET_ENCRYPTION_KEY` in backend env.
- Google login `Missing required parameter client_id`:
  - set `NEXT_PUBLIC_GOOGLE_CLIENT_ID` in frontend env.
- Google `redirect_uri_mismatch` / origin issues:
  - add exact frontend origin (no path, no trailing slash) in Google OAuth config.
- Slow API in production:
  - keep app and DB in nearby regions,
  - avoid free sleeping instance for voice workloads.

## Production Readiness Checklist

Use the detailed runbook in:
- `backend/PRODUCTION_DEPLOY_CHECKLIST.md`

Minimum go-live checks:
- `NODE_ENV=production`
- `ALLOW_PLAINTEXT_SECRETS=false`
- Twilio signature validation enabled
- DB migrations applied
- secrets re-encrypted
- outbound call test passes end-to-end
