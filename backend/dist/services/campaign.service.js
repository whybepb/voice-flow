"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CampaignService = void 0;
exports.processCampaignCallJob = processCampaignCallJob;
exports.finalizeCampaignDispatchIfIdle = finalizeCampaignDispatchIfIdle;
const prisma_1 = __importDefault(require("../prisma")); // Adjust import based on your structure
const client_1 = require("@prisma/client");
const twilio_service_1 = require("./twilio.service");
const user_secrets_service_1 = require("./user-secrets.service");
function normalizePhoneNumber(value) {
    let candidate = value.trim().replace(/[\s\-().]/g, '');
    if (!candidate)
        return null;
    if (candidate.startsWith('00')) {
        candidate = `+${candidate.slice(2)}`;
    }
    if (!candidate.startsWith('+')) {
        if (/^\d{10}$/.test(candidate)) {
            candidate = `+1${candidate}`;
        }
        else if (/^\d{11,15}$/.test(candidate)) {
            candidate = `+${candidate}`;
        }
        else {
            return null;
        }
    }
    if (!/^\+[1-9]\d{7,14}$/.test(candidate)) {
        return null;
    }
    return candidate;
}
exports.CampaignService = {
    createCampaign: async (userId, name, type, scheduledAt, phoneNumbers) => {
        const normalizedPhones = Array.from(new Set((phoneNumbers || [])
            .map((phone) => normalizePhoneNumber(phone))
            .filter((phone) => Boolean(phone))));
        if ((phoneNumbers?.length || 0) > 0 && normalizedPhones.length === 0) {
            throw new Error('No valid phone numbers found. Use E.164 format (e.g., +14155552671).');
        }
        const campaign = await prisma_1.default.campaign.create({
            data: {
                name,
                type,
                scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
                status: 'DRAFT',
                userId,
            },
        });
        if (normalizedPhones.length > 0) {
            for (const phone of normalizedPhones) {
                // Find customer by phone
                let customer = await prisma_1.default.customer.findFirst({
                    where: { phone, userId }
                });
                // Create customer if it doesn't exist
                if (!customer) {
                    customer = await prisma_1.default.customer.create({
                        data: {
                            name: 'Unknown',
                            phone: phone,
                            userId,
                        }
                    });
                }
                // Create booking linked to this campaign
                await prisma_1.default.booking.create({
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
    getAllCampaigns: async (userId) => {
        return prisma_1.default.campaign.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: {
                bookings: { where: { userId } }, // You might limit this for performance later
            },
        });
    },
    getCampaignById: async (userId, id) => {
        return prisma_1.default.campaign.findFirst({
            where: { id, userId },
            include: { bookings: { where: { userId } } }
        });
    },
    startCampaign: async (userId, campaignId) => {
        // 1. Update status to RUNNING
        const campaign = await prisma_1.default.campaign.findFirst({
            where: { id: campaignId, userId },
            select: { id: true },
        });
        if (!campaign) {
            return { message: 'Campaign not found', count: 0 };
        }
        await prisma_1.default.campaign.update({
            where: { id: campaignId },
            data: { status: 'RUNNING' },
            include: { bookings: true }, // Ideally linking bookings happens before start
        });
        // In a real app, you would select bookings linked to this campaign
        // For MVP, lets assume we want to call all bookings linked to this campaign 
        // OR we pick pending bookings if no bookings specifically linked.
        // Using bookings linked to the campaign:
        const bookingsToCall = await prisma_1.default.booking.findMany({
            where: {
                campaignId: campaignId,
                status: client_1.BookingStatus.PENDING,
                lastCallStatus: null,
                userId,
            },
            include: { customer: true }
        });
        if (bookingsToCall.length === 0) {
            console.log(`No pending bookings found for campaign ${campaignId}`);
            // Maybe update to COMPLETED if no bookings
            await prisma_1.default.campaign.update({ where: { id: campaignId }, data: { status: 'COMPLETED' } });
            return { message: 'No bookings to process', count: 0 };
        }
        const twilioCreds = await (0, user_secrets_service_1.getUserTwilioCredentials)(userId);
        if (!twilioCreds) {
            throw new Error('Twilio credentials are not configured for this account.');
        }
        // 2. Queue calls
        await Promise.all(bookingsToCall.map((booking) => prisma_1.default.backgroundJob.create({
            data: {
                userId,
                type: client_1.BackgroundJobType.CAMPAIGN_CALL,
                payload: {
                    userId,
                    campaignId,
                    bookingId: booking.id,
                },
                maxAttempts: 3,
            },
        })));
        return { message: 'Campaign started', count: bookingsToCall.length };
    }
};
async function processCampaignCallJob(userId, campaignId, bookingId) {
    const booking = await prisma_1.default.booking.findFirst({
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
    const existingCallLog = await prisma_1.default.callLog.findFirst({
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
    const twilioCreds = await (0, user_secrets_service_1.getUserTwilioCredentials)(userId);
    if (!twilioCreds) {
        throw new Error('Twilio credentials are not configured for this account.');
    }
    await prisma_1.default.booking.update({
        where: { id: booking.id },
        data: { lastCallStatus: 'dispatching' },
    });
    try {
        const baseUrl = process.env.BASE_URL || 'http://localhost:5001';
        const twimlUrl = `${baseUrl}/voice/outbound`;
        const statusCallbackUrl = `${baseUrl}/webhooks/twilio`;
        const call = await twilio_service_1.TwilioService.makeCall({
            accountSid: twilioCreds.accountSid,
            authToken: twilioCreds.authToken,
        }, booking.customer.phone, twilioCreds.phoneNumber, twimlUrl, statusCallbackUrl);
        await prisma_1.default.booking.update({
            where: { id: booking.id },
            data: { lastCallStatus: call.status || 'queued' }
        });
        await prisma_1.default.callLog.create({
            data: {
                bookingId: booking.id,
                sid: call.sid,
                callStatus: call.status,
                userId,
            }
        });
    }
    catch (error) {
        await prisma_1.default.booking.update({
            where: { id: booking.id },
            data: { lastCallStatus: 'failed' }
        }).catch(() => { });
        throw error;
    }
}
function payloadField(payload, key) {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        return null;
    }
    const value = payload[key];
    return typeof value === 'string' ? value : null;
}
async function finalizeCampaignDispatchIfIdle(payload) {
    const campaignId = payloadField(payload, 'campaignId');
    const userId = payloadField(payload, 'userId');
    if (!campaignId || !userId) {
        return;
    }
    const outstandingJobs = await prisma_1.default.$queryRaw `
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
    await prisma_1.default.campaign.updateMany({
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
