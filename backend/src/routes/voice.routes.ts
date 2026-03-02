import { Router } from 'express';
import { handleIncomingCall, handleOutboundCall } from '../controllers/voice.controller';
import { verifyTwilioSignature } from '../middlewares/twilio-signature.middleware';

const router = Router();

// Twilio calls these endpoints to get TwiML instructions
router.post('/incoming', verifyTwilioSignature, handleIncomingCall);
router.post('/outbound', verifyTwilioSignature, handleOutboundCall);

export default router;
