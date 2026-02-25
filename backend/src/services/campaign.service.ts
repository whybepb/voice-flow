import prisma from '../prisma'; // Adjust import based on your structure
import { BookingStatus } from '@prisma/client';
import { TwilioService } from './twilio.service';
import QueueService from './queue.service';

export const CampaignService = {
    createCampaign: async (name: string, type: string, scheduledAt?: string) => {
        return prisma.campaign.create({
            data: {
                name,
                type,
                scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
                status: 'DRAFT',
            },
        });
    },

    getAllCampaigns: async () => {
        return prisma.campaign.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                bookings: true, // You might limit this for performance later
            },
        });
    },

    getCampaignById: async (id: string) => {
        return prisma.campaign.findUnique({
            where: { id },
            include: { bookings: true }
        });
    },

    startCampaign: async (campaignId: string) => {
        // 1. Update status to RUNNING
        const campaign = await prisma.campaign.update({
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
            },
            include: { customer: true }
        });

        if (bookingsToCall.length === 0) {
            console.log(`No pending bookings found for campaign ${campaignId}`);
            // Maybe update to COMPLETED if no bookings
            await prisma.campaign.update({ where: { id: campaignId }, data: { status: 'COMPLETED' } });
            return { message: 'No bookings to process', count: 0 };
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

                    const call = await TwilioService.makeCall(
                        booking.customer.phone,
                        process.env.TWILIO_PHONE_NUMBER as string,
                        twimlUrl
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
