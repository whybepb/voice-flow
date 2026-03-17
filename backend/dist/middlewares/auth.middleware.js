"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authGuard = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../prisma"));
const errorHandler_1 = require("./errorHandler");
const runtime_config_1 = require("../utils/runtime-config");
const authGuard = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (!token) {
            return next(new errorHandler_1.AppError('Not authorized, no token provided', 401));
        }
        const decoded = jsonwebtoken_1.default.verify(token, (0, runtime_config_1.getJwtSecret)());
        const user = await prisma_1.default.user.findUnique({
            where: { id: decoded.id },
            select: { id: true, email: true, role: true },
        });
        if (!user) {
            return next(new errorHandler_1.AppError('User not found', 401));
        }
        req.user = user;
        next();
    }
    catch (error) {
        next(new errorHandler_1.AppError('Not authorized, token invalid', 401));
    }
};
exports.authGuard = authGuard;
