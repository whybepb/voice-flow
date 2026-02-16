'use client';

import React from 'react';
import {
    BarChart as RechartsBarChart,
    Bar,
    LineChart as RechartsLineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Area,
    AreaChart as RechartsAreaChart,
} from 'recharts';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface ChartProps {
    data: any[];
    dataKey: string;
    xAxisKey?: string;
    color?: string;
    height?: number;
    type?: 'bar' | 'line' | 'area';
    title: string;
    subtitle?: string;
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-xl">
                <p className="text-xs text-muted">{label}</p>
                <p className="text-sm font-semibold text-foreground">{payload[0].value}%</p>
            </div>
        );
    }
    return null;
};

export default function Chart({
    data,
    dataKey,
    xAxisKey = 'month',
    color = '#6366f1',
    height = 240,
    type = 'area',
    title,
    subtitle,
}: ChartProps) {
    return (
        <div className="rounded-xl border border-border bg-card/50 p-5 backdrop-blur-sm">
            <div className="mb-4">
                <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                {subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}
            </div>
            <ResponsiveContainer width="100%" height={height}>
                {type === 'bar' ? (
                    <RechartsBarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a2e42" vertical={false} />
                        <XAxis dataKey={xAxisKey} tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.08)' }} />
                        <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} barSize={32} />
                    </RechartsBarChart>
                ) : type === 'line' ? (
                    <RechartsLineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a2e42" vertical={false} />
                        <XAxis dataKey={xAxisKey} tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2.5} dot={{ fill: color, strokeWidth: 0, r: 4 }} activeDot={{ r: 6, fill: color }} />
                    </RechartsLineChart>
                ) : (
                    <RechartsAreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                        <defs>
                            <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={color} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a2e42" vertical={false} />
                        <XAxis dataKey={xAxisKey} tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2.5} fill={`url(#gradient-${dataKey})`} dot={{ fill: color, strokeWidth: 0, r: 3 }} activeDot={{ r: 5, fill: color }} />
                    </RechartsAreaChart>
                )}
            </ResponsiveContainer>
        </div>
    );
}
