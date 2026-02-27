"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const webhooks_controller_1 = require("../controllers/webhooks.controller");
const router = (0, express_1.Router)();
// Twilio usually sends POST requests
router.post('/twilio', webhooks_controller_1.handleTwilioWebhook);
exports.default = router;
