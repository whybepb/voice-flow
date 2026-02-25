import { Router } from 'express';
import { handleIncomingCall, handleOutboundCall } from '../controllers/voice.controller';

const router = Router();

// Twilio calls these endpoints to get TwiML instructions
router.post('/incoming', handleIncomingCall);
router.post('/outbound', handleOutboundCall);

export default router;
