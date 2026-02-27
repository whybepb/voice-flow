"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwilioService = void 0;
const twilio_1 = __importDefault(require("twilio"));
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = (0, twilio_1.default)(accountSid, authToken);
exports.TwilioService = {
    makeCall: async (to, from, url, statusCallbackUrl) => {
        try {
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
    sendSMS: async (to, from, body) => {
        try {
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
