import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import prisma from '../prisma';
import { AppError } from '../middlewares/errorHandler';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (id: string) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', {
        expiresIn: '30d',
    });
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, email, password } = req.body;

        if (!email || !password) {
            return next(new AppError('Please provide email and password', 400));
        }

        const userExists = await prisma.user.findUnique({
            where: { email },
        });

        if (userExists) {
            return next(new AppError('User already exists', 400));
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await prisma.user.create({
            data: {
                name: name || null,
                email,
                password: hashedPassword,
            },
        });

        res.status(201).json({
            status: 'success',
            data: {
                id: user.id,
                email: user.email,
                name: user.name,
                onboardingComplete: user.onboardingComplete,
                token: generateToken(user.id),
            },
        });
    } catch (error) {
        next(error);
    }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return next(new AppError('Please provide email and password', 400));
        }

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return next(new AppError('Invalid email or password', 401));
        }

        res.status(200).json({
            status: 'success',
            data: {
                id: user.id,
                email: user.email,
                name: user.name,
                onboardingComplete: user.onboardingComplete,
                token: generateToken(user.id),
            },
        });
    } catch (error) {
        next(error);
    }
};

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user!.id },
            select: {
                id: true,
                email: true,
                name: true,
                company: true,
                role: true,
                onboardingComplete: true,
                createdAt: true,
            },
        });

        if (!user) {
            return next(new AppError('User not found', 404));
        }

        res.status(200).json({
            status: 'success',
            data: user,
        });
    } catch (error) {
        next(error);
    }
};

export const updateOnboarding = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { company, twilioAccountSid, twilioAuthToken, twilioPhoneNumber, openaiApiKey } = req.body;

        if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber || !openaiApiKey) {
            return next(new AppError('Please provide all required credentials', 400));
        }

        const user = await prisma.user.update({
            where: { id: req.user!.id },
            data: {
                company: company || null,
                twilioAccountSid,
                twilioAuthToken,
                twilioPhoneNumber,
                openaiApiKey,
                onboardingComplete: true,
            },
            select: {
                id: true,
                email: true,
                name: true,
                company: true,
                role: true,
                onboardingComplete: true,
            },
        });

        res.status(200).json({
            status: 'success',
            data: user,
        });
    } catch (error) {
        next(error);
    }
};

export const googleLogin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { credential } = req.body;

        if (!credential) {
            return next(new AppError('Google credential is required', 400));
        }

        let email: string | undefined;
        let name: string | undefined;
        let googleId: string | undefined;

        // Try verifying as ID token first
        try {
            const ticket = await googleClient.verifyIdToken({
                idToken: credential,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            const payload = ticket.getPayload();
            if (payload?.email) {
                email = payload.email;
                name = payload.name;
                googleId = payload.sub;
            }
        } catch {
            // Not an ID token — treat as access token and fetch userinfo
            const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${credential}` },
            });

            if (!userInfoRes.ok) {
                return next(new AppError('Invalid Google credential', 401));
            }

            const userInfo = await userInfoRes.json() as { email?: string; name?: string; sub?: string };
            email = userInfo.email;
            name = userInfo.name;
            googleId = userInfo.sub;
        }

        if (!email) {
            return next(new AppError('Could not retrieve email from Google', 401));
        }

        // Find existing user or create new one
        let user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            const salt = await bcrypt.genSalt(10);
            const randomPassword = await bcrypt.hash(`google_${googleId || 'oauth'}_${Date.now()}`, salt);

            user = await prisma.user.create({
                data: {
                    email,
                    name: name || null,
                    password: randomPassword,
                },
            });
        }

        res.status(200).json({
            status: 'success',
            data: {
                id: user.id,
                email: user.email,
                name: user.name,
                onboardingComplete: user.onboardingComplete,
                token: generateToken(user.id),
            },
        });
    } catch (error) {
        next(error);
    }
};
