"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardAnalytics = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const getDashboardAnalytics = async (req, res, next) => {
    try {
        // Fetch all bookings and call logs in parallel
        const [bookings, callLogs, campaigns] = await Promise.all([
            prisma_1.default.booking.findMany({ select: { status: true, createdAt: true } }),
            prisma_1.default.callLog.findMany({ select: { callStatus: true, createdAt: true } }),
            prisma_1.default.campaign.findMany({
                select: {
                    id: true,
                    status: true,
                    bookings: {
                        select: { id: true, status: true, lastCallStatus: true },
                    },
                },
            }),
        ]);
        const totalBookings = bookings.length;
        const totalCalls = callLogs.length;
        // ── Current Rates ────────────────────────────────────────
        const confirmed = bookings.filter((b) => b.status === 'CONFIRMED').length;
        const cancelled = bookings.filter((b) => b.status === 'CANCELLED').length;
        const rescheduled = bookings.filter((b) => b.status === 'RESCHEDULED').length;
        const completedCalls = callLogs.filter((c) => c.callStatus?.toLowerCase() === 'completed').length;
        const confirmationRate = totalBookings > 0 ? Math.round((confirmed / totalBookings) * 100) : 0;
        const cancellationRate = totalBookings > 0 ? Math.round((cancelled / totalBookings) * 100) : 0;
        const rescheduleRate = totalBookings > 0 ? Math.round((rescheduled / totalBookings) * 100) : 0;
        const callSuccessRate = totalCalls > 0 ? Math.round((completedCalls / totalCalls) * 100) : 0;
        // ── Monthly Breakdown (last 6 months) ────────────────────
        const months = getLastNMonths(6);
        const confirmationByMonth = months.map((m) => {
            const inRange = bookings.filter((b) => sameMonth(b.createdAt, m.date));
            const conf = inRange.filter((b) => b.status === 'CONFIRMED').length;
            return { month: m.label, value: inRange.length > 0 ? Math.round((conf / inRange.length) * 100) : 0 };
        });
        const cancellationByMonth = months.map((m) => {
            const inRange = bookings.filter((b) => sameMonth(b.createdAt, m.date));
            const canc = inRange.filter((b) => b.status === 'CANCELLED').length;
            return { month: m.label, value: inRange.length > 0 ? Math.round((canc / inRange.length) * 100) : 0 };
        });
        const rescheduleByMonth = months.map((m) => {
            const inRange = bookings.filter((b) => sameMonth(b.createdAt, m.date));
            const resc = inRange.filter((b) => b.status === 'RESCHEDULED').length;
            return { month: m.label, value: inRange.length > 0 ? Math.round((resc / inRange.length) * 100) : 0 };
        });
        const callSuccessByMonth = months.map((m) => {
            const inRange = callLogs.filter((c) => sameMonth(c.createdAt, m.date));
            const comp = inRange.filter((c) => c.callStatus?.toLowerCase() === 'completed').length;
            return { month: m.label, value: inRange.length > 0 ? Math.round((comp / inRange.length) * 100) : 0 };
        });
        const callVolumeByMonth = months.map((m) => {
            const count = callLogs.filter((c) => sameMonth(c.createdAt, m.date)).length;
            return { month: m.label, value: count };
        });
        // ── Campaign Summary ─────────────────────────────────────
        const activeCampaigns = campaigns.filter((c) => c.status === 'RUNNING').length;
        const scheduledCampaigns = campaigns.filter((c) => c.status === 'DRAFT').length;
        const completedCampaigns = campaigns.filter((c) => c.status === 'COMPLETED').length;
        // Total calls / pending / failed across all campaigns
        const allCampaignBookings = campaigns.flatMap((c) => c.bookings);
        const campaignTotalCalls = allCampaignBookings.length;
        const campaignCompleted = allCampaignBookings.filter((b) => b.lastCallStatus?.toLowerCase() === 'completed').length;
        const campaignPending = allCampaignBookings.filter((b) => b.status === 'PENDING').length;
        const campaignFailed = allCampaignBookings.filter((b) => ['failed', 'busy', 'no-answer', 'canceled'].includes(b.lastCallStatus?.toLowerCase() || '')).length;
        const campaignFailRate = campaignTotalCalls > 0
            ? Math.round((campaignFailed / campaignTotalCalls) * 100)
            : 0;
        res.json({
            rates: {
                confirmationRate,
                cancellationRate,
                rescheduleRate,
                callSuccessRate,
            },
            monthly: {
                confirmationRate: confirmationByMonth,
                cancellationRate: cancellationByMonth,
                rescheduleRate: rescheduleByMonth,
                callSuccessRate: callSuccessByMonth,
                callVolume: callVolumeByMonth,
            },
            campaignSummary: {
                active: activeCampaigns,
                scheduled: scheduledCampaigns,
                completed: completedCampaigns,
                totalCalls: campaignTotalCalls,
                completedCalls: campaignCompleted,
                pendingCalls: campaignPending,
                failedRate: campaignFailRate,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getDashboardAnalytics = getDashboardAnalytics;
// ── Helpers ──────────────────────────────────────────────────────
function getLastNMonths(n) {
    const result = [];
    const now = new Date();
    for (let i = n - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = d.toLocaleString('default', { month: 'short' });
        result.push({ label, date: d });
    }
    return result;
}
function sameMonth(date, ref) {
    const d = new Date(date);
    return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
}
