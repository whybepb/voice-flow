# Production Deploy Checklist

## 1. Required Environment Variables

- `DATABASE_URL`
- `JWT_SECRET`
- `SECRET_ENCRYPTION_KEY` (32-byte base64 or 64-char hex preferred)
- `TWILIO_SIGNATURE_VALIDATION=true`
- `ALLOW_PLAINTEXT_SECRETS=false`
- `NODE_ENV=production`
- `BASE_URL` (public backend URL, e.g. `https://app.whybepb.site/voice-agent-api`)

## 2. Migrations

For a **new production database**:

```bash
npm run db:migrate
```

For an **existing database that was previously managed with `db push`**:

```bash
npm run db:baseline:resolve
npm run db:migrate
```

## 3. Encrypt Existing Stored Secrets

If users were onboarded before `SECRET_ENCRYPTION_KEY` was configured:

```bash
npm run secrets:encrypt
```

## 4. Twilio Configuration

- Voice webhook (TwiML app): `POST /voice/incoming` and `POST /voice/outbound`
- Call status callback: `POST /webhooks/twilio`
- Ensure Twilio sends requests to your exact production domain (signature check is strict on URL/host).

## 5. Startup Verification

- Backend boots without `SECRET_ENCRYPTION_KEY` errors.
- `GET /` health check responds.
- Upload a knowledge doc and confirm job appears in `GET /jobs`.
- Place one test call and confirm:
  - webhook accepted (not `403`)
  - call log status updates
  - transcript + post-call analysis saved
