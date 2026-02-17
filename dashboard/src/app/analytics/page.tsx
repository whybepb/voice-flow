'use client';

import React from 'react';
import Chart from '@/components/Chart';
import { analytics } from '@/lib/data';
import { FadeIn, StaggerContainer } from '@/components/ui/Motion';
import { CheckCircle2, XCircle, RefreshCw, PhoneForwarded } from 'lucide-react';

export default function AnalyticsPage() {
    const metrics = [
        { title: 'Confirmation Rate', value: '84%', sub: '↑ 2% this month', color: 'emerald', icon: CheckCircle2 },
        { title: 'Cancellation Rate', value: '9%', sub: '↓ 1% this month', color: 'rose', icon: XCircle },
        { title: 'Reschedule Rate', value: '6%', sub: '↑ 1% this month', color: 'blue', icon: RefreshCw },
        { title: 'Call Success Rate', value: '87%', sub: '↑ 3% this month', color: 'violet', icon: PhoneForwarded },
    ];

    return (
        <StaggerContainer className="space-y-8">
            <FadeIn>
                <h1 className="text-3xl font-bold text-foreground tracking-tight">Analytics</h1>
                <p className="text-sm text-muted-foreground mt-1.5">Track performance metrics and call outcomes over time</p>
            </FadeIn>

            <FadeIn delay={0.1}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {metrics.map((m, i) => (
                        <div
                            key={i}
                            className={`rounded-2xl border border-white/5 bg-${m.color}-500/5 p-6 backdrop-blur-sm relative overflow-hidden group hover:border-${m.color}-500/20 transition-colors`}
                        >
                            <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-${m.color}-500`}>
                                <m.icon className="w-16 h-16" />
                            </div>
                            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">{m.title}</p>
                            <h3 className={`text-3xl font-bold text-${m.color}-400 mb-1`}>{m.value}</h3>
                            <p className={`text-xs font-medium text-${m.color}-500/80`}>{m.sub}</p>
                        </div>
                    ))}
                </div>
            </FadeIn>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FadeIn delay={0.2}>
                    <Chart
                        data={analytics.confirmationRate}
                        dataKey="value"
                        title="Confirmation Rate"
                        subtitle="Percentage of bookings confirmed via AI calls"
                        color="#10b981"
                        type="line"
                    />
                </FadeIn>
                <FadeIn delay={0.3}>
                    <Chart
                        data={analytics.cancellationRate}
                        dataKey="value"
                        title="Cancellation Rate"
                        subtitle="Percentage of bookings cancelled"
                        color="#f43f5e"
                        type="bar"
                    />
                </FadeIn>
                <FadeIn delay={0.4}>
                    <Chart
                        data={analytics.rescheduleRate}
                        dataKey="value"
                        title="Reschedule Rate"
                        subtitle="Percentage of bookings rescheduled"
                        color="#3b82f6"
                        type="line"
                    />
                </FadeIn>
                <FadeIn delay={0.5}>
                    <Chart
                        data={analytics.callSuccessRate}
                        dataKey="value"
                        title="Call Success Rate"
                        subtitle="Percentage of calls that connected successfully"
                        color="#8b5cf6"
                        type="line"
                    />
                </FadeIn>
            </div>
        </StaggerContainer>
    );
}
