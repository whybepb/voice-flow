import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';

export const globalSearch = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const query = req.query.q as string;
        const userId = req.user!.id;

        if (!query || query.trim().length === 0) {
            return res.status(200).json({
                status: 'success',
                data: {
                    customers: [],
                    campaigns: [],
                    knowledge: []
                }
            });
        }

        const searchTerm = query.trim();

        // Run parallel queries against models
        const [customers, campaigns, knowledge] = await Promise.all([
            // 1. Search Customers by name, email, or phone
            prisma.customer.findMany({
                where: {
                    userId,
                    OR: [
                        { name: { contains: searchTerm, mode: 'insensitive' } },
                        { email: { contains: searchTerm, mode: 'insensitive' } },
                        { phone: { contains: searchTerm, mode: 'insensitive' } },
                    ]
                },
                take: 5,
                select: { id: true, name: true, phone: true, email: true },
            }),
            // 2. Search Campaigns by name
            prisma.campaign.findMany({
                where: {
                    userId,
                    name: { contains: searchTerm, mode: 'insensitive' }
                },
                take: 5,
                select: { id: true, name: true, status: true, type: true },
            }),
            // 3. Search Knowledge Documents by filename
            prisma.knowledgeDocument.findMany({
                where: {
                    userId,
                    fileName: { contains: searchTerm, mode: 'insensitive' }
                },
                take: 5,
                select: { id: true, fileName: true, fileType: true, status: true },
            })
        ]);

        res.status(200).json({
            status: 'success',
            data: {
                customers,
                campaigns,
                knowledge
            }
        });
    } catch (error) {
        next(error);
    }
};
