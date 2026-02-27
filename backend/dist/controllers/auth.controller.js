"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../prisma"));
const errorHandler_1 = require("../middlewares/errorHandler");
const generateToken = (id) => {
    return jsonwebtoken_1.default.sign({ id }, process.env.JWT_SECRET || 'secret', {
        expiresIn: '30d',
    });
};
const register = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return next(new errorHandler_1.AppError('Please provide email and password', 400));
        }
        const userExists = await prisma_1.default.user.findUnique({
            where: { email },
        });
        if (userExists) {
            return next(new errorHandler_1.AppError('User already exists', 400));
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(password, salt);
        const user = await prisma_1.default.user.create({
            data: {
                email,
                password: hashedPassword,
            },
        });
        res.status(201).json({
            status: 'success',
            data: {
                id: user.id,
                email: user.email,
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
            return next(new errorHandler_1.AppError('Please provide email and password', 400));
        }
        const user = await prisma_1.default.user.findUnique({
            where: { email },
        });
        if (!user || !(await bcryptjs_1.default.compare(password, user.password))) {
            return next(new errorHandler_1.AppError('Invalid email or password', 401));
        }
        res.status(200).json({
            status: 'success',
            data: {
                id: user.id,
                email: user.email,
                token: generateToken(user.id),
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.login = login;
