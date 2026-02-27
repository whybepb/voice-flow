"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const voice_controller_1 = require("../controllers/voice.controller");
const router = (0, express_1.Router)();
// Twilio calls these endpoints to get TwiML instructions
router.post('/incoming', voice_controller_1.handleIncomingCall);
router.post('/outbound', voice_controller_1.handleOutboundCall);
exports.default = router;
