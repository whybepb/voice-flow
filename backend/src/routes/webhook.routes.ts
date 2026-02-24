import { Router } from 'express';
import { handleTwilioWebhook } from '../controllers/webhook.controller';

const router = Router();

// Twilio Webhooks usually use POST
router.post('/twilio', handleTwilioWebhook);

export default router;
