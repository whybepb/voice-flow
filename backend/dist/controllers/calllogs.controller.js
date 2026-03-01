"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCallLogById = exports.getCallLogs = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const getCallLogs = async (req, res, next) => {
    try {
        const callLogs = await prisma_1.default.callLog.findMany({
            where: { userId: req.user.id },
            include: {
                booking: {
                    include: {
                        customer: true,
                        campaign: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        res.status(200).json({
            status: 'success',
            results: callLogs.length,
            data: {
                callLogs,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getCallLogs = getCallLogs;
const getCallLogById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const callLog = await prisma_1.default.callLog.findFirst({
            where: { id, userId: req.user.id },
            include: {
                booking: {
                    include: {
                        customer: true,
                        campaign: true,
                    },
                },
            },
        });
        if (!callLog) {
            res.status(404).json({ status: 'fail', message: 'Call log not found' });
            return;
        }
        res.status(200).json({
            status: 'success',
            data: {
                callLog,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getCallLogById = getCallLogById;
