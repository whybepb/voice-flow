import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';
import { AppError } from '../middlewares/errorHandler';

export const createCustomer = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, phone, email } = req.body;

        if (!name || !phone) {
            return next(new AppError('Please provide name and phone number', 400));
        }

        const customer = await prisma.customer.create({
            data: {
                name,
                phone,
                email,
                userId: req.user!.id,
            },
        });

        res.status(201).json({
            status: 'success',
            data: {
                customer,
            },
        });
    } catch (error) {
        next(error);
    }
};

export const getCustomers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const customers = await prisma.customer.findMany({
            where: { userId: req.user!.id },
            include: {
                bookings: { where: { userId: req.user!.id } },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        res.status(200).json({
            status: 'success',
            results: customers.length,
            data: {
                customers,
            },
        });
    } catch (error) {
        next(error);
    }
};
