import { Request, Response, NextFunction } from 'express';
import { CampaignService } from '../services/campaign.service';
import prisma from '../prisma';

export const createCampaign = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, type, scheduledAt, phoneNumbers } = req.body;
        const campaign = await CampaignService.createCampaign(name, type, scheduledAt, phoneNumbers);
        res.status(201).json({ message: 'Campaign created', campaign });
    } catch (error) {
        next(error);
    }
};

export const getCampaigns = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const campaigns = await CampaignService.getAllCampaigns();
        res.json({ results: campaigns.length, campaigns }); // Unified response format
    } catch (error) {
        next(error);
    }
};

export const getCampaignById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const campaign = await CampaignService.getCampaignById(id as string);
        if (!campaign) {
            res.status(404).json({ message: 'Campaign not found' });
            return;
        }
        res.json({ campaign });
    } catch (error) {
        next(error);
    }
};

export const startCampaign = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const result = await CampaignService.startCampaign(id as string);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

export const addBookingToCampaign = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params; // Campaign ID
        const { bookingId } = req.body;

        await prisma.booking.update({
            where: { id: bookingId },
            data: { campaignId: id as string }
        });

        res.json({ message: 'Booking added to campaign' });
    } catch (error) {
        next(error);
    }
}
