'use client';

import React from 'react';
import Chart from '@/components/Chart';
import { analyticsData } from '@/lib/data';

export default function AnalyticsPage() {
    // Summary stats from latest data point
    const latest = analyticsData[analyticsData.length - 1];

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div>
                <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
                <p className="text-sm text-muted mt-1">Track performance metrics and call outcomes</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                    <p className="text-xs text-muted font-medium uppercase tracking-wider">Confirmation Rate</p>
                    <p className="text-2xl font-bold text-emerald-400 mt-1">{latest.confirmationRate}%</p>
                    <p className="text-xs text-emerald-400/70 mt-1">↑ 2% this month</p>
                </div>
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                    <p className="text-xs text-muted font-medium uppercase tracking-wider">Cancellation Rate</p>
                    <p className="text-2xl font-bold text-red-400 mt-1">{latest.cancellationRate}%</p>
                    <p className="text-xs text-red-400/70 mt-1">↓ 1% this month</p>
                </div>
                <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
                    <p className="text-xs text-muted font-medium uppercase tracking-wider">Reschedule Rate</p>
                    <p className="text-2xl font-bold text-blue-400 mt-1">{latest.rescheduleRate}%</p>
                    <p className="text-xs text-blue-400/70 mt-1">↑ 1% this month</p>
                </div>
                <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
                    <p className="text-xs text-muted font-medium uppercase tracking-wider">Call Success Rate</p>
                    <p className="text-2xl font-bold text-violet-400 mt-1">{latest.callSuccessRate}%</p>
                    <p className="text-xs text-violet-400/70 mt-1">↑ 3% this month</p>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Chart
                    data={analyticsData}
                    dataKey="confirmationRate"
                    title="Confirmation Rate"
                    subtitle="Percentage of bookings confirmed via AI calls"
                    color="#10b981"
                    type="area"
                />
                <Chart
                    data={analyticsData}
                    dataKey="cancellationRate"
                    title="Cancellation Rate"
                    subtitle="Percentage of bookings cancelled"
                    color="#ef4444"
                    type="bar"
                />
                <Chart
                    data={analyticsData}
                    dataKey="rescheduleRate"
                    title="Reschedule Rate"
                    subtitle="Percentage of bookings rescheduled"
                    color="#3b82f6"
                    type="line"
                />
                <Chart
                    data={analyticsData}
                    dataKey="callSuccessRate"
                    title="Call Success Rate"
                    subtitle="Percentage of calls that connected successfully"
                    color="#8b5cf6"
                    type="area"
                />
            </div>
        </div>
    );
}
