export { };

import twilio from 'twilio';

export interface TwilioClientConfig {
    accountSid: string;
    authToken: string;
}

function getTwilioClient(config: TwilioClientConfig) {
    return twilio(config.accountSid, config.authToken);
}

function shouldMockTwilio() {
    return process.env.MOCK_TWILIO === 'true';
}

export const TwilioService = {
    makeCall: async (
        config: TwilioClientConfig,
        to: string,
        from: string,
        url: string,
        statusCallbackUrl?: string
    ) => {
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
        } catch (error) {
            console.error('Error making call:', error);
            throw error;
        }
    },

    sendSMS: async (config: TwilioClientConfig, to: string, from: string, body: string) => {
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
        } catch (error) {
            console.error('Error sending SMS:', error);
            throw error;
        }
    }
};
