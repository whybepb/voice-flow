import prisma from '../prisma'; // Adjust import based on your structure
import { BookingStatus } from '@prisma/client';
import { TwilioService } from './twilio.service';
import QueueService from './queue.service';
import { getUserTwilioCredentials } from './user-secrets.service';

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
    createCampaign: async (userId: string, name: string, type: string, scheduledAt?: string, phoneNumbers?: string[]) => {
        const normalizedPhones = Array.from(new Set(
            (phoneNumbers || [])
                .map((phone) => normalizePhoneNumber(phone))
                .filter((phone): phone is string => Boolean(phone))
        ));

        if ((phoneNumbers?.length || 0) > 0 && normalizedPhones.length === 0) {
            throw new Error('No valid phone numbers found. Use E.164 format (e.g., +14155552671).');
        }

        const campaign = await prisma.campaign.create({
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
        bookingsToCall.forEach((booking) => {
            QueueService.addJob(async () => {
                console.log(`Processing booking ${booking.id} for customer ${booking.customer.phone}`);

                try {
                    // Call Twilio
                    // The TwiML URL tells Twilio to connect the call to our WebSocket media stream
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

                    // Update Booking Status
                    await prisma.booking.update({
                        where: { id: booking.id },
                        data: { lastCallStatus: 'queued', status: 'PENDING' } // Or 'Calling'
                    });

                    // Create CallLog
                    await prisma.callLog.create({
                        data: {
                            bookingId: booking.id,
                            sid: call.sid,
                            callStatus: call.status,
                            userId,
                        }
                    });

                } catch (error) {
                    console.error(`Failed to call booking ${booking.id}:`, error);
                    await prisma.booking.update({
                        where: { id: booking.id },
                        data: { lastCallStatus: 'failed' }
                    });
                }
            });
        });

        return { message: 'Campaign started', count: bookingsToCall.length };
    }
};
