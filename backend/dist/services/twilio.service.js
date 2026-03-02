"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwilioService = void 0;
const twilio_1 = __importDefault(require("twilio"));
function getTwilioClient(config) {
    return (0, twilio_1.default)(config.accountSid, config.authToken);
}
function shouldMockTwilio() {
    return process.env.MOCK_TWILIO === 'true';
}
exports.TwilioService = {
    makeCall: async (config, to, from, url, statusCallbackUrl) => {
        try {
            if (shouldMockTwilio()) {
                return {
                    sid: `MOCK_CALL_${Date.now()}`,
                    status: 'queued',
                    to,
                    from,
                    url,
                };
            }
            const client = getTwilioClient(config);
            const call = await client.calls.create({
                url,
                to,
                from,
                ...(statusCallbackUrl && {
                    statusCallback: statusCallbackUrl,
                    statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
                    statusCallbackMethod: 'POST',
                }),
            });
            return call;
        }
        catch (error) {
            console.error('Error making call:', error);
            throw error;
        }
    },
    sendSMS: async (config, to, from, body) => {
        try {
            if (shouldMockTwilio()) {
                return {
                    sid: `MOCK_SMS_${Date.now()}`,
                    status: 'queued',
                    to,
                    from,
                    body,
                };
            }
            const client = getTwilioClient(config);
            const message = await client.messages.create({
                body,
                from,
                to,
            });
            return message;
        }
        catch (error) {
            console.error('Error sending SMS:', error);
            throw error;
        }
    }
};
