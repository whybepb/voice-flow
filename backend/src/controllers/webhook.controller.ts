import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';

async function findCallLogWithRetry(callSid: string, attempts = 5, delayMs = 400) {
    for (let attempt = 0; attempt < attempts; attempt++) {
        const existingLog = await prisma.callLog.findUnique({
            where: { sid: callSid }
        });

        if (existingLog) {
            return existingLog;
        }

        if (attempt < attempts - 1) {
            await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
    }

    return null;
}

export const handleTwilioWebhook = async (req: Request, res: Response, next: NextFunction) => {
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
        const existingLog = await findCallLogWithRetry(CallSid);

        if (existingLog) {
            await prisma.callLog.update({
                where: { sid: CallSid },
                data: {
                    callStatus: CallStatus,
                    duration: Duration ? parseInt(Duration) : undefined,
                    recordingUrl: RecordingUrl,
                }
            });

        // Twilio delivery status is operational metadata, not appointment state.
        await prisma.booking.update({
            where: { id: existingLog.bookingId },
            data: { lastCallStatus: CallStatus }
        });

        } else {
            console.warn(`Received webhook for unknown CallSid: ${CallSid}`);
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('Webhook Error:', error);
        next(error);
    }
};
