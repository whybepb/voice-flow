"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleTwilioWebhook = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const handleTwilioWebhook = async (req, res, next) => {
    try {
        const { CallSid, CallStatus, RecordingUrl, Duration } = req.body;
        console.log(`Webhook received: SID=${CallSid}, Status=${CallStatus}`);
        if (!CallSid) {
            res.status(400).send('Missing CallSid');
            return;
        }
        // Find CallLog
        // Note: In startCampaign we created CallLog with 'queued' or 'initiated' status but sid might be missing initially if we didn't get it immediately? 
        // Actually in CampaignService we waited for call.sid. So we should have it.
        // Upsert? Or just update?
        // If it exists, update it.
        // Twilio sends multiple updates (initiated, ringing, answered, completed)
        // Check if CallLog exists
        const existingLog = await prisma_1.default.callLog.findUnique({
            where: { sid: CallSid }
        });
        if (existingLog) {
            await prisma_1.default.callLog.update({
                where: { sid: CallSid },
                data: {
                    callStatus: CallStatus,
                    duration: Duration ? parseInt(Duration) : undefined,
                    recordingUrl: RecordingUrl,
                }
            });
            // Twilio delivery status is operational metadata, not appointment state.
            await prisma_1.default.booking.update({
                where: { id: existingLog.bookingId },
                data: { lastCallStatus: CallStatus }
            });
        }
        else {
            console.warn(`Received webhook for unknown CallSid: ${CallSid}`);
            // Optionally create a new log if we want to track unsolicited calls?
        }
        res.status(200).send('OK');
    }
    catch (error) {
        console.error('Webhook Error:', error);
        next(error);
    }
};
exports.handleTwilioWebhook = handleTwilioWebhook;
