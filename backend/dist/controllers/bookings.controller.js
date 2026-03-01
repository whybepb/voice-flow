"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBookingStatus = exports.getBookings = exports.createBooking = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const errorHandler_1 = require("../middlewares/errorHandler");
const createBooking = async (req, res, next) => {
    try {
        const { customerId, appointmentTime } = req.body;
        if (!customerId || !appointmentTime) {
            return next(new errorHandler_1.AppError('Please provide customerId and appointmentTime', 400));
        }
        const customer = await prisma_1.default.customer.findFirst({
            where: { id: customerId, userId: req.user.id },
            select: { id: true },
        });
        if (!customer) {
            return next(new errorHandler_1.AppError('Customer not found', 404));
        }
        const booking = await prisma_1.default.booking.create({
            data: {
                customerId,
                userId: req.user.id,
                appointmentTime: new Date(appointmentTime),
            },
        });
        res.status(201).json({
            status: 'success',
            data: {
                booking,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createBooking = createBooking;
const getBookings = async (req, res, next) => {
    try {
        const bookings = await prisma_1.default.booking.findMany({
            where: { userId: req.user.id },
            include: {
                customer: true,
                callLogs: {
                    where: { userId: req.user.id },
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
    }
    catch (error) {
        next(error);
    }
};
exports.getBookings = getBookings;
const updateBookingStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!status) {
            return next(new errorHandler_1.AppError('Please provide status', 400));
        }
        const result = await prisma_1.default.booking.updateMany({
            where: { id, userId: req.user.id },
            data: { status },
        });
        if (result.count === 0) {
            return next(new errorHandler_1.AppError('Booking not found', 404));
        }
        res.status(200).json({
            status: 'success',
            data: {
                id,
                status,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateBookingStatus = updateBookingStatus;
