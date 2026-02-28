import { Request, Response, NextFunction } from 'express';
import { CampaignService } from '../services/campaign.service';
import prisma from '../prisma';
import { AppError } from '../middlewares/errorHandler';

export const createCampaign = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, type, scheduledAt, phoneNumbers } = req.body;
        const campaign = await CampaignService.createCampaign(req.user!.id, name, type, scheduledAt, phoneNumbers);
        res.status(201).json({ message: 'Campaign created', campaign });
    } catch (error) {
        next(error);
    }
};

export const getCampaigns = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const campaigns = await CampaignService.getAllCampaigns(req.user!.id);
        res.json({ results: campaigns.length, campaigns }); // Unified response format
    } catch (error) {
        next(error);
    }
};

export const getCampaignById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const campaign = await CampaignService.getCampaignById(req.user!.id, id as string);
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
        const result = await CampaignService.startCampaign(req.user!.id, id as string);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

export const addBookingToCampaign = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params; // Campaign ID
        const { bookingId } = req.body;

        const campaign = await prisma.campaign.findFirst({
            where: { id: id as string, userId: req.user!.id },
            select: { id: true },
        });

        if (!campaign) {
            return next(new AppError('Campaign not found', 404));
        }

        const result = await prisma.booking.updateMany({
            where: { id: bookingId, userId: req.user!.id },
            data: { campaignId: id as string }
        });

        if (result.count === 0) {
            return next(new AppError('Booking not found', 404));
        }

        res.json({ message: 'Booking added to campaign' });
    } catch (error) {
        next(error);
    }
}
