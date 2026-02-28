'use client';

import React from 'react';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    LineChart,
    Line,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
} from 'recharts';
import { HoverCard } from '@/components/ui/Motion';

interface ChartProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any[];
    dataKey: string;
    title: string;
    subtitle?: string;
    color?: string;
    type?: 'bar' | 'line' | 'area';
    height?: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-card/90 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3 shadow-xl shadow-black/40 text-foreground">
                <p className="text-[11px] font-medium text-muted-foreground mb-1 uppercase tracking-wider">{label}</p>
                <p className="text-lg font-bold">
                    {payload[0].value}
                    <span className="text-sm font-normal text-muted-foreground ml-1">bookings</span>
                </p>
            </div>
        );
    }
    return null;
};

export default function Chart({ data, dataKey, title, subtitle, color = '#6366f1', type = 'bar', height: _height = 240 }: ChartProps) {
    const commonProps = {
        data,
        margin: { top: 10, right: 10, left: -20, bottom: 0 },
    };

    const axisProps = {
        stroke: '#27272a',
        tick: { fill: '#a1a1aa', fontSize: 11, fontWeight: 500 },
        tickLine: false,
        axisLine: false,
        dy: 10,
    };

    const renderChart = () => {
        switch (type) {
            case 'line':
                return (
                    <LineChart {...commonProps}>
                        <CartesianGrid strokeDasharray="4 4" stroke="#27272a" vertical={false} />
                        <XAxis dataKey="month" {...axisProps} />
                        <YAxis {...axisProps} />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#27272a', strokeWidth: 1 }} />
                        <Line
                            type="monotone"
                            dataKey={dataKey}
                            stroke={color}
                            strokeWidth={3}
                            dot={false}
                            activeDot={{ r: 6, fill: color, stroke: '#18181b', strokeWidth: 4 }}
                            animationDuration={1500}
                        />
                    </LineChart>
                );
            case 'area':
                return (
                    <AreaChart {...commonProps}>
                        <defs>
                            <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                                <stop offset="90%" stopColor={color} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="4 4" stroke="#27272a" vertical={false} />
                        <XAxis dataKey="month" {...axisProps} />
                        <YAxis {...axisProps} />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#27272a', strokeWidth: 1 }} />
                        <Area
                            type="monotone"
                            dataKey={dataKey}
                            stroke={color}
                            strokeWidth={3}
                            fill={`url(#grad-${dataKey})`}
                            animationDuration={1500}
                        />
                    </AreaChart>
                );
            default:
                return (
                    <BarChart {...commonProps}>
                        <CartesianGrid strokeDasharray="4 4" stroke="#27272a" vertical={false} />
                        <XAxis dataKey="month" {...axisProps} />
                        <YAxis {...axisProps} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'white', opacity: 0.05 }} />
                        <Bar
                            dataKey={dataKey}
                            fill={color}
                            radius={[6, 6, 0, 0]}
                            opacity={0.9}
                            animationDuration={1500}
                        />
                    </BarChart>
                );
        }
    };

    return (
        <HoverCard className="rounded-2xl border border-white/5 bg-white/5 p-6 backdrop-blur-sm">
            <div className="mb-6">
                <h3 className="text-sm font-semibold text-foreground tracking-tight">{title}</h3>
                {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">{subtitle}</p>}
            </div>
            <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    {renderChart()}
                </ResponsiveContainer>
            </div>
        </HoverCard>
    );
}
