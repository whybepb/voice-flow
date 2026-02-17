'use client';

import React from 'react';
import { LucideIcon, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { HoverCard } from '@/components/ui/Motion';
import { cn } from '@/lib/utils';

interface StatCardProps {
    title: string;
    value: string | number;
    trend: 'up' | 'down' | 'neutral';
    trendValue: string;
    icon: LucideIcon;
    color?: 'primary' | 'emerald' | 'amber' | 'rose' | 'violet';
}

const colorMap = {
    primary: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/20' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/20' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/20' },
    rose: { bg: 'bg-rose-500/10', text: 'text-rose-500', border: 'border-rose-500/20' },
    violet: { bg: 'bg-violet-500/10', text: 'text-violet-500', border: 'border-violet-500/20' },
};

export default function StatCard({ title, value, trend, trendValue, icon: Icon, color = 'primary' }: StatCardProps) {
    const styles = colorMap[color];

    return (
        <HoverCard className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/5 p-6 backdrop-blur-sm transition-colors hover:bg-white/10 group">
            <div className="flex items-start justify-between">
                <div className="space-y-4">
                    <div className={cn("p-2.5 w-10 h-10 rounded-xl flex items-center justify-center transition-colors", styles.bg)}>
                        <Icon className={cn("w-5 h-5", styles.text)} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <h3 className="text-2xl font-bold mt-1 text-white tracking-tight">{value}</h3>
                    </div>
                </div>

                <div className={cn(
                    "flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-lg border",
                    trend === 'up' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                        trend === 'down' ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                            "bg-gray-500/10 text-gray-400 border-gray-500/20"
                )}>
                    {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> :
                        trend === 'down' ? <ArrowDownRight className="w-3 h-3" /> :
                            <Minus className="w-3 h-3" />}
                    <span>{trendValue}</span>
                </div>
            </div>
        </HoverCard>
    );
}
