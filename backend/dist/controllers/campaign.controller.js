"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addBookingToCampaign = exports.startCampaign = exports.getCampaignById = exports.getCampaigns = exports.createCampaign = void 0;
const campaign_service_1 = require("../services/campaign.service");
const prisma_1 = __importDefault(require("../prisma"));
const errorHandler_1 = require("../middlewares/errorHandler");
const createCampaign = async (req, res, next) => {
    try {
        const { name, type, scheduledAt, phoneNumbers, voiceMode, agentVoiceOverride } = req.body;
        const campaign = await campaign_service_1.CampaignService.createCampaign(req.user.id, name, type, scheduledAt, phoneNumbers, voiceMode, agentVoiceOverride);
        res.status(201).json({ message: 'Campaign created', campaign });
    }
    catch (error) {
        next(error);
    }
};
exports.createCampaign = createCampaign;
const getCampaigns = async (req, res, next) => {
    try {
        const campaigns = await campaign_service_1.CampaignService.getAllCampaigns(req.user.id);
        res.json({ results: campaigns.length, campaigns }); // Unified response format
    }
    catch (error) {
        next(error);
    }
};
exports.getCampaigns = getCampaigns;
const getCampaignById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const campaign = await campaign_service_1.CampaignService.getCampaignById(req.user.id, id);
        if (!campaign) {
            res.status(404).json({ message: 'Campaign not found' });
            return;
        }
        res.json({ campaign });
    }
    catch (error) {
        next(error);
    }
};
exports.getCampaignById = getCampaignById;
const startCampaign = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await campaign_service_1.CampaignService.startCampaign(req.user.id, id);
        res.json(result);
    }
    catch (error) {
        next(error);
    }
};
exports.startCampaign = startCampaign;
const addBookingToCampaign = async (req, res, next) => {
    try {
        const { id } = req.params; // Campaign ID
        const { bookingId } = req.body;
        const campaign = await prisma_1.default.campaign.findFirst({
            where: { id: id, userId: req.user.id },
            select: { id: true },
        });
        if (!campaign) {
            return next(new errorHandler_1.AppError('Campaign not found', 404));
        }
        const result = await prisma_1.default.booking.updateMany({
            where: { id: bookingId, userId: req.user.id },
            data: { campaignId: id }
        });
        if (result.count === 0) {
            return next(new errorHandler_1.AppError('Booking not found', 404));
        }
        res.json({ message: 'Booking added to campaign' });
    }
    catch (error) {
        next(error);
    }
};
exports.addBookingToCampaign = addBookingToCampaign;
