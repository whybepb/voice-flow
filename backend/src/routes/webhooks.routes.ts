import { Router } from 'express';
import { handleTwilioWebhook } from '../controllers/webhooks.controller';

const router = Router();

// Twilio usually sends POST requests
router.post('/twilio', handleTwilioWebhook);

export default router;
