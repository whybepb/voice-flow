import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';
import { AppError } from '../middlewares/errorHandler';

export const createBooking = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { customerId, appointmentTime } = req.body;

        if (!customerId || !appointmentTime) {
            return next(new AppError('Please provide customerId and appointmentTime', 400));
        }

        const booking = await prisma.booking.create({
            data: {
                customerId,
                appointmentTime: new Date(appointmentTime),
            },
        });

        res.status(201).json({
            status: 'success',
            data: {
                booking,
            },
        });
    } catch (error) {
        next(error);
    }
};

export const getBookings = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const bookings = await prisma.booking.findMany({
            include: {
                customer: true,
                callLogs: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
            orderBy: {
                appointmentTime: 'asc',
            },
        });

        res.status(200).json({
            status: 'success',
            results: bookings.length,
            data: {
                bookings,
            },
        });
    } catch (error) {
        next(error);
    }
};

export const updateBookingStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params as { id: string };
        const { status } = req.body;

        if (!status) {
            return next(new AppError('Please provide status', 400));
        }

        const booking = await prisma.booking.update({
            where: { id },
            data: { status },
        });

        res.status(200).json({
            status: 'success',
            data: {
                booking,
            },
        });
    } catch (error) {
        next(error);
    }
};
