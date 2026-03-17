import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';
import { AppError } from './errorHandler';
import { getJwtSecret } from '../utils/runtime-config';

// Extend Express Request to include user
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string;
                role: string;
            };
        }
    }
}

export const authGuard = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let token: string | undefined;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return next(new AppError('Not authorized, no token provided', 401));
        }

        const decoded = jwt.verify(token, getJwtSecret()) as { id: string };

        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: { id: true, email: true, role: true },
        });

        if (!user) {
            return next(new AppError('User not found', 401));
        }

        req.user = user;
        next();
    } catch (error) {
        next(new AppError('Not authorized, token invalid', 401));
    }
};
