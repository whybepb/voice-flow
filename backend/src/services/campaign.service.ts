import prisma from '../prisma'; // Adjust import based on your structure
import { BackgroundJobType, BookingStatus, Prisma } from '@prisma/client';
import { TwilioService } from './twilio.service';
import { getUserTwilioCredentials } from './user-secrets.service';

type VoiceModeValue = 'DEFAULT' | 'PREMIUM';

function normalizePhoneNumber(value: string): string | null {
    let candidate = value.trim().replace(/[\s\-().]/g, '');
    if (!candidate) return null;

    if (candidate.startsWith('00')) {
        candidate = `+${candidate.slice(2)}`;
    }

    if (!candidate.startsWith('+')) {
        if (/^\d{10}$/.test(candidate)) {
            candidate = `+1${candidate}`;
        } else if (/^\d{11,15}$/.test(candidate)) {
            candidate = `+${candidate}`;
        } else {
            return null;
        }
    }

    if (!/^\+[1-9]\d{7,14}$/.test(candidate)) {
        return null;
    }

    return candidate;
}

export const CampaignService = {
    createCampaign: async (
        userId: string,
        name: string,
        type: string,
        scheduledAt?: string,
        phoneNumbers?: string[],
        voiceMode?: string,
        agentVoiceOverride?: string,
    ) => {
        const normalizedPhones = Array.from(new Set(
            (phoneNumbers || [])
                .map((phone) => normalizePhoneNumber(phone))
                .filter((phone): phone is string => Boolean(phone))
        ));
        const normalizedVoiceMode = normalizeVoiceMode(voiceMode);
        const normalizedVoiceOverride = normalizeVoiceOverride(agentVoiceOverride);

        if ((phoneNumbers?.length || 0) > 0 && normalizedPhones.length === 0) {
            throw new Error('No valid phone numbers found. Use E.164 format (e.g., +14155552671).');
        }

        const campaign = await prisma.campaign.create({
            data: {
                name,
                type,
                scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
                status: 'DRAFT',
                voiceMode: normalizedVoiceMode,
                agentVoiceOverride: normalizedVoiceOverride,
                userId,
            },
        });

        if (normalizedPhones.length > 0) {
            for (const phone of normalizedPhones) {
                // Find customer by phone
                let customer = await prisma.customer.findFirst({
                    where: { phone, userId }
                });

                // Create customer if it doesn't exist
                if (!customer) {
                    customer = await prisma.customer.create({
                        data: {
                            name: 'Unknown',
                            phone: phone,
                            userId,
                        }
                    });
                }

                // Create booking linked to this campaign
                await prisma.booking.create({
                    data: {
                        customerId: customer.id,
                        campaignId: campaign.id,
                        appointmentTime: scheduledAt ? new Date(scheduledAt) : new Date(),
                        status: 'PENDING',
                        userId,
                    }
                });
            }
        }

        return campaign;
    },

    getAllCampaigns: async (userId: string) => {
        return prisma.campaign.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: {
                bookings: { where: { userId } }, // You might limit this for performance later
            },
        });
    },

    getCampaignById: async (userId: string, id: string) => {
        return prisma.campaign.findFirst({
            where: { id, userId },
            include: { bookings: { where: { userId } } }
        });
    },

    startCampaign: async (userId: string, campaignId: string) => {
        // 1. Update status to RUNNING
        const campaign = await prisma.campaign.findFirst({
            where: { id: campaignId, userId },
            select: { id: true },
        });

        if (!campaign) {
            return { message: 'Campaign not found', count: 0 };
        }

        await prisma.campaign.update({
            where: { id: campaignId },
            data: { status: 'RUNNING' },
            include: { bookings: true }, // Ideally linking bookings happens before start
        });

        // In a real app, you would select bookings linked to this campaign
        // For MVP, lets assume we want to call all bookings linked to this campaign 
        // OR we pick pending bookings if no bookings specifically linked.

        // Using bookings linked to the campaign:
        const bookingsToCall = await prisma.booking.findMany({
            where: {
                campaignId: campaignId,
                status: BookingStatus.PENDING,
                lastCallStatus: null,
                userId,
            },
            include: { customer: true }
        });

        if (bookingsToCall.length === 0) {
            console.log(`No pending bookings found for campaign ${campaignId}`);
            // Maybe update to COMPLETED if no bookings
            await prisma.campaign.update({ where: { id: campaignId }, data: { status: 'COMPLETED' } });
            return { message: 'No bookings to process', count: 0 };
        }

        const twilioCreds = await getUserTwilioCredentials(userId);
        if (!twilioCreds) {
            throw new Error('Twilio credentials are not configured for this account.');
        }

        // 2. Queue calls
        await Promise.all(
            bookingsToCall.map((booking) =>
                prisma.backgroundJob.create({
                    data: {
                        userId,
                        type: BackgroundJobType.CAMPAIGN_CALL,
                        payload: {
                            userId,
                            campaignId,
                            bookingId: booking.id,
                        },
                        maxAttempts: 3,
                    },
                })
            )
        );

        return { message: 'Campaign started', count: bookingsToCall.length };
    }
};

function normalizeVoiceMode(value?: string): VoiceModeValue {
    if (value === 'PREMIUM' || value === 'premium') {
        return 'PREMIUM';
    }
    return 'DEFAULT';
}

function normalizeVoiceOverride(value?: string): string | null {
    if (!value) return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}

export async function processCampaignCallJob(
    userId: string,
    campaignId: string,
    bookingId: string,
) {
    const booking = await prisma.booking.findFirst({
        where: {
            id: bookingId,
            campaignId,
            userId,
        },
        include: {
            customer: true,
        },
    });

    if (!booking) {
        throw new Error(`Booking ${bookingId} was not found for campaign ${campaignId}`);
    }

    const existingCallLog = await prisma.callLog.findFirst({
        where: {
            bookingId,
            userId,
            sid: { not: null },
        },
        select: { id: true },
    });

    if (existingCallLog) {
        return;
    }

    const twilioCreds = await getUserTwilioCredentials(userId);
    if (!twilioCreds) {
        throw new Error('Twilio credentials are not configured for this account.');
    }

    await prisma.booking.update({
        where: { id: booking.id },
        data: { lastCallStatus: 'dispatching' },
    });

    try {
        const baseUrl = process.env.BASE_URL || 'http://localhost:5001';
        const twimlUrl = `${baseUrl}/voice/outbound`;
        const statusCallbackUrl = `${baseUrl}/webhooks/twilio`;

        const call = await TwilioService.makeCall(
            {
                accountSid: twilioCreds.accountSid,
                authToken: twilioCreds.authToken,
            },
            booking.customer.phone,
            twilioCreds.phoneNumber,
            twimlUrl,
            statusCallbackUrl
        );

        await prisma.booking.update({
            where: { id: booking.id },
            data: { lastCallStatus: call.status || 'queued' }
        });

        await prisma.callLog.create({
            data: {
                bookingId: booking.id,
                sid: call.sid,
                callStatus: call.status,
                userId,
            }
        });
    } catch (error) {
        await prisma.booking.update({
            where: { id: booking.id },
            data: { lastCallStatus: 'failed' }
        }).catch(() => { });
        throw error;
    }
}

function payloadField(payload: Prisma.JsonValue, key: string): string | null {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        return null;
    }

    const value = (payload as Record<string, unknown>)[key];
    return typeof value === 'string' ? value : null;
}

export async function finalizeCampaignDispatchIfIdle(payload: Prisma.JsonValue) {
    const campaignId = payloadField(payload, 'campaignId');
    const userId = payloadField(payload, 'userId');

    if (!campaignId || !userId) {
        return;
    }

    const outstandingJobs = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*)::bigint AS count
        FROM "BackgroundJob"
        WHERE "type" = 'CAMPAIGN_CALL'
          AND "status" IN ('PENDING', 'PROCESSING', 'RETRY')
          AND "payload"->>'campaignId' = ${campaignId}
          AND COALESCE("payload"->>'userId', '') = ${userId}
    `;

    if (Number(outstandingJobs[0]?.count || 0) > 0) {
        return;
    }

    await prisma.campaign.updateMany({
        where: {
            id: campaignId,
            userId,
            status: 'RUNNING',
        },
        data: {
            status: 'COMPLETED',
        },
    });
}
