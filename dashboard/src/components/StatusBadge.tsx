'use client';

import React from 'react';

type BadgeVariant = 'Confirmed' | 'Pending' | 'Cancelled' | 'Rescheduled' | 'Successful' | 'Failed' | 'No Answer' | 'Voicemail' | 'Active' | 'Inactive' | 'Completed' | 'In Progress' | 'Scheduled';

const variantStyles: Record<string, string> = {
    Confirmed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    Successful: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    Completed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    Active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    Pending: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    'In Progress': 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    Voicemail: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    Scheduled: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    Rescheduled: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    'No Answer': 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    Cancelled: 'bg-red-500/15 text-red-400 border-red-500/20',
    Failed: 'bg-red-500/15 text-red-400 border-red-500/20',
    Inactive: 'bg-gray-500/15 text-gray-400 border-gray-500/20',
};

interface StatusBadgeProps {
    status: BadgeVariant | string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
    const style = variantStyles[status] || 'bg-gray-500/15 text-gray-400 border-gray-500/20';

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style}`}>
            {status}
        </span>
    );
}
