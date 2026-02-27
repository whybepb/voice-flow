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
        const booking = await prisma_1.default.booking.create({
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
    }
    catch (error) {
        next(error);
    }
};
exports.createBooking = createBooking;
const getBookings = async (req, res, next) => {
    try {
        const bookings = await prisma_1.default.booking.findMany({
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
        const booking = await prisma_1.default.booking.update({
            where: { id },
            data: { status },
        });
        res.status(200).json({
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
exports.updateBookingStatus = updateBookingStatus;
