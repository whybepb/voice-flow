import { Router } from 'express';
import { handleTwilioWebhook } from '../controllers/webhook.controller';
import { verifyTwilioSignature } from '../middlewares/twilio-signature.middleware';

const router = Router();

// Twilio Webhooks usually use POST
router.post('/twilio', verifyTwilioSignature, handleTwilioWebhook);

export default router;
