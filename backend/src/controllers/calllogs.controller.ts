import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';

export const getCallLogs = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const callLogs = await prisma.callLog.findMany({
            include: {
                booking: {
                    include: {
                        customer: true,
                        campaign: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        res.status(200).json({
            status: 'success',
            results: callLogs.length,
            data: {
                callLogs,
            },
        });
    } catch (error) {
        next(error);
    }
};

export const getCallLogById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params as { id: string };

        const callLog = await prisma.callLog.findUnique({
            where: { id },
            include: {
                booking: {
                    include: {
                        customer: true,
                        campaign: true,
                    },
                },
            },
        });

        if (!callLog) {
            res.status(404).json({ status: 'fail', message: 'Call log not found' });
            return;
        }

        res.status(200).json({
            status: 'success',
            data: {
                callLog,
            },
        });
    } catch (error) {
        next(error);
    }
};
