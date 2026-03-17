"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.googleLogin = exports.updateOnboarding = exports.updateSettings = exports.getMe = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const google_auth_library_1 = require("google-auth-library");
const prisma_1 = __importDefault(require("../prisma"));
const errorHandler_1 = require("../middlewares/errorHandler");
const secret_crypto_1 = require("../utils/secret-crypto");
const user_secrets_service_1 = require("../services/user-secrets.service");
const runtime_config_1 = require("../utils/runtime-config");
const googleClient = new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const generateToken = (id) => {
    return jsonwebtoken_1.default.sign({ id }, (0, runtime_config_1.getJwtSecret)(), {
        expiresIn: "30d",
    });
};
const register = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;
        if (!email || !password) {
            return next(new errorHandler_1.AppError("Please provide email and password", 400));
        }
        const userExists = await prisma_1.default.user.findUnique({
            where: { email },
        });
        if (userExists) {
            return next(new errorHandler_1.AppError("User already exists", 400));
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(password, salt);
        const user = await prisma_1.default.user.create({
            data: {
                name: name || null,
                email,
                password: hashedPassword,
            },
        });
        res.status(201).json({
            status: "success",
            data: {
                id: user.id,
                email: user.email,
                name: user.name,
                onboardingComplete: user.onboardingComplete,
                token: generateToken(user.id),
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.register = register;
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return next(new errorHandler_1.AppError("Please provide email and password", 400));
        }
        const user = await prisma_1.default.user.findUnique({
            where: { email },
        });
        if (!user || !(await bcryptjs_1.default.compare(password, user.password))) {
            return next(new errorHandler_1.AppError("Invalid email or password", 401));
        }
        res.status(200).json({
            status: "success",
            data: {
                id: user.id,
                email: user.email,
                name: user.name,
                onboardingComplete: user.onboardingComplete,
                token: generateToken(user.id),
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.login = login;
const getMe = async (req, res, next) => {
    try {
        const user = await prisma_1.default.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                email: true,
                name: true,
                company: true,
                role: true,
                onboardingComplete: true,
                createdAt: true,
                agentVoice: true,
                agentPrompt: true,
            },
        });
        if (!user) {
            return next(new errorHandler_1.AppError("User not found", 404));
        }
        const credentialStatus = await (0, user_secrets_service_1.getRedactedCredentialStatus)(req.user.id);
        res.status(200).json({
            status: "success",
            data: {
                ...user,
                credentialStatus,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getMe = getMe;
const updateSettings = async (req, res, next) => {
    try {
        const { agentVoice, agentPrompt, company, name } = req.body;
        const user = await prisma_1.default.user.update({
            where: { id: req.user.id },
            data: {
                ...(agentVoice !== undefined && { agentVoice }),
                ...(agentPrompt !== undefined && { agentPrompt }),
                ...(company !== undefined && { company }),
                ...(name !== undefined && { name }),
            },
            select: {
                id: true,
                email: true,
                name: true,
                company: true,
                agentVoice: true,
                agentPrompt: true,
            },
        });
        res.status(200).json({
            status: "success",
            data: user,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateSettings = updateSettings;
const updateOnboarding = async (req, res, next) => {
    try {
        const { company, twilioAccountSid, twilioAuthToken, twilioPhoneNumber, openaiApiKey, } = req.body;
        if (!twilioAccountSid ||
            !twilioAuthToken ||
            !twilioPhoneNumber ||
            !openaiApiKey) {
            return next(new errorHandler_1.AppError("Please provide all required credentials", 400));
        }
        const user = await prisma_1.default.user.update({
            where: { id: req.user.id },
            data: {
                company: company || null,
                twilioAccountSid: (0, secret_crypto_1.encryptSecret)(twilioAccountSid),
                twilioAuthToken: (0, secret_crypto_1.encryptSecret)(twilioAuthToken),
                twilioPhoneNumber,
                openaiApiKey: (0, secret_crypto_1.encryptSecret)(openaiApiKey),
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
            status: "success",
            data: user,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateOnboarding = updateOnboarding;
const googleLogin = async (req, res, next) => {
    try {
        const { credential } = req.body;
        if (!credential) {
            return next(new errorHandler_1.AppError("Google credential is required", 400));
        }
        let email;
        let name;
        let googleId;
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
        }
        catch {
            // Not an ID token — treat as access token and fetch userinfo
            const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                headers: { Authorization: `Bearer ${credential}` },
            });
            if (!userInfoRes.ok) {
                return next(new errorHandler_1.AppError("Invalid Google credential", 401));
            }
            const userInfo = (await userInfoRes.json());
            email = userInfo.email;
            name = userInfo.name;
            googleId = userInfo.sub;
        }
        if (!email) {
            return next(new errorHandler_1.AppError("Could not retrieve email from Google", 401));
        }
        // Find existing user or create new one
        let user = await prisma_1.default.user.findUnique({
            where: { email },
        });
        if (!user) {
            const salt = await bcryptjs_1.default.genSalt(10);
            const randomPassword = await bcryptjs_1.default.hash(`google_${googleId || "oauth"}_${Date.now()}`, salt);
            user = await prisma_1.default.user.create({
                data: {
                    email,
                    name: name || null,
                    password: randomPassword,
                },
            });
        }
        res.status(200).json({
            status: "success",
            data: {
                id: user.id,
                email: user.email,
                name: user.name,
                onboardingComplete: user.onboardingComplete,
                token: generateToken(user.id),
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.googleLogin = googleLogin;
