import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';
import { AppError } from '../middlewares/errorHandler';

export const createBooking = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { customerId, appointmentTime } = req.body;

        if (!customerId || !appointmentTime) {
            return next(new AppError('Please provide customerId and appointmentTime', 400));
        }

        const customer = await prisma.customer.findFirst({
            where: { id: customerId, userId: req.user!.id },
            select: { id: true },
        });

        if (!customer) {
            return next(new AppError('Customer not found', 404));
        }

        const booking = await prisma.booking.create({
            data: {
                customerId,
                userId: req.user!.id,
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
            where: { userId: req.user!.id },
            include: {
                customer: true,
                callLogs: {
                    where: { userId: req.user!.id },
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

        const result = await prisma.booking.updateMany({
            where: { id, userId: req.user!.id },
            data: { status },
        });

        if (result.count === 0) {
            return next(new AppError('Booking not found', 404));
        }

        res.status(200).json({
            status: 'success',
            data: {
                id,
                status,
            },
        });
    } catch (error) {
        next(error);
    }
};
