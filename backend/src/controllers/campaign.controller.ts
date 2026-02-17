import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middlewares/errorHandler';

export const startCampaign = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { campaignName, customerIds } = req.body;

        if (!campaignName || !customerIds || !Array.isArray(customerIds)) {
            return next(new AppError('Please provide campaignName and customerIds array', 400));
        }

        // Logic to start campaign (e.g., trigger calls) would go here
        console.log(`Starting campaign: ${campaignName} for ${customerIds.length} customers`);

        res.status(200).json({
            status: 'success',
            message: 'Campaign started successfully',
            data: {
                campaignName,
                targetCount: customerIds.length,
            },
        });
    } catch (error) {
        next(error);
    }
};
