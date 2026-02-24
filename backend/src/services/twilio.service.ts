export { };

import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

export const TwilioService = {
    makeCall: async (to: string, from: string, url: string) => {
        try {
            const call = await client.calls.create({
                url,
                to,
                from,
            });
            return call;
        } catch (error) {
            console.error('Error making call:', error);
            throw error;
        }
    },

    sendSMS: async (to: string, from: string, body: string) => {
        try {
            const message = await client.messages.create({
                body,
                from,
                to,
            });
            return message;
        } catch (error) {
            console.error('Error sending SMS:', error);
            throw error;
        }
    }
};
