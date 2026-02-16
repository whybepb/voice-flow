'use client';

import React from 'react';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    trend?: { value: number; isPositive: boolean };
    color?: string;
}

export default function StatCard({ title, value, icon, trend, color = 'primary' }: StatCardProps) {
    const colorMap: Record<string, string> = {
        primary: 'from-indigo-500/20 to-indigo-600/5 border-indigo-500/20',
        success: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/20',
        warning: 'from-amber-500/20 to-amber-600/5 border-amber-500/20',
        danger: 'from-red-500/20 to-red-600/5 border-red-500/20',
        info: 'from-blue-500/20 to-blue-600/5 border-blue-500/20',
    };

    const iconColorMap: Record<string, string> = {
        primary: 'text-indigo-400 bg-indigo-500/15',
        success: 'text-emerald-400 bg-emerald-500/15',
        warning: 'text-amber-400 bg-amber-500/15',
        danger: 'text-red-400 bg-red-500/15',
        info: 'text-blue-400 bg-blue-500/15',
    };

    return (
        <div className={`relative overflow-hidden rounded-xl border bg-gradient-to-br p-5
      ${colorMap[color]} backdrop-blur-sm hover:scale-[1.02] transition-transform duration-300`}>
            <div className="flex items-start justify-between">
                <div className="space-y-2">
                    <p className="text-sm font-medium text-muted">{title}</p>
                    <p className="text-3xl font-bold text-foreground">{value}</p>
                    {trend && (
                        <div className={`flex items-center gap-1 text-xs font-medium ${trend.isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                            <svg className={`w-3 h-3 ${!trend.isPositive ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l5-5 5 5M7 7l5 5 5-5" />
                            </svg>
                            {trend.value}% from last week
                        </div>
                    )}
                </div>
                <div className={`p-3 rounded-lg ${iconColorMap[color]}`}>
                    {icon}
                </div>
            </div>

            {/* Decorative glow */}
            <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-white/5 blur-2xl" />
        </div>
    );
}
