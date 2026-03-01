"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCustomers = exports.createCustomer = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const errorHandler_1 = require("../middlewares/errorHandler");
const createCustomer = async (req, res, next) => {
    try {
        const { name, phone, email } = req.body;
        if (!name || !phone) {
            return next(new errorHandler_1.AppError('Please provide name and phone number', 400));
        }
        const customer = await prisma_1.default.customer.create({
            data: {
                name,
                phone,
                email,
                userId: req.user.id,
            },
        });
        res.status(201).json({
            status: 'success',
            data: {
                customer,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createCustomer = createCustomer;
const getCustomers = async (req, res, next) => {
    try {
        const customers = await prisma_1.default.customer.findMany({
            where: { userId: req.user.id },
            include: {
                bookings: { where: { userId: req.user.id } },
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
    }
    catch (error) {
        next(error);
    }
};
exports.getCustomers = getCustomers;
