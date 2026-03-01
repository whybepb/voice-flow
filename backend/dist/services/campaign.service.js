"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CampaignService = void 0;
const prisma_1 = __importDefault(require("../prisma")); // Adjust import based on your structure
const client_1 = require("@prisma/client");
const twilio_service_1 = require("./twilio.service");
const queue_service_1 = __importDefault(require("./queue.service"));
exports.CampaignService = {
    createCampaign: async (userId, name, type, scheduledAt, phoneNumbers) => {
        const campaign = await prisma_1.default.campaign.create({
            data: {
                name,
                type,
                scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
                status: 'DRAFT',
                userId,
            },
        });
        if (phoneNumbers && phoneNumbers.length > 0) {
            for (const phone of phoneNumbers) {
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
        // 2. Queue calls
        bookingsToCall.forEach((booking) => {
            queue_service_1.default.addJob(async () => {
                console.log(`Processing booking ${booking.id} for customer ${booking.customer.phone}`);
                try {
                    // Call Twilio
                    // The TwiML URL tells Twilio to connect the call to our WebSocket media stream
                    const baseUrl = process.env.BASE_URL || 'http://localhost:5001';
                    const twimlUrl = `${baseUrl}/voice/outbound`;
                    const statusCallbackUrl = `${baseUrl}/webhooks/twilio`;
                    const call = await twilio_service_1.TwilioService.makeCall(booking.customer.phone, process.env.TWILIO_PHONE_NUMBER, twimlUrl, statusCallbackUrl);
                    // Update Booking Status
                    await prisma_1.default.booking.update({
                        where: { id: booking.id },
                        data: { lastCallStatus: 'queued', status: 'PENDING' } // Or 'Calling'
                    });
                    // Create CallLog
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
                    console.error(`Failed to call booking ${booking.id}:`, error);
                    await prisma_1.default.booking.update({
                        where: { id: booking.id },
                        data: { lastCallStatus: 'failed' }
                    });
                }
            });
        });
        return { message: 'Campaign started', count: bookingsToCall.length };
    }
};
