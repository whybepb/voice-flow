"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const webhook_controller_1 = require("../controllers/webhook.controller");
const twilio_signature_middleware_1 = require("../middlewares/twilio-signature.middleware");
const router = (0, express_1.Router)();
// Twilio Webhooks usually use POST
router.post('/twilio', twilio_signature_middleware_1.verifyTwilioSignature, webhook_controller_1.handleTwilioWebhook);
exports.default = router;
