'use client';

import React from 'react';

interface StatusBadgeProps {
    status: string;
}

const statusStyles: Record<string, string> = {
    Confirmed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    Successful: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    Completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    Active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    Pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    Scheduled: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    Cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
    Failed: 'bg-red-500/10 text-red-400 border-red-500/20',
    Rescheduled: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'In Progress': 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    'No Answer': 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    Voicemail: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
    Inactive: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
};

export default function StatusBadge({ status }: StatusBadgeProps) {
    const style = statusStyles[status] || 'bg-gray-500/10 text-gray-400 border-gray-500/20';

    return (
        <span className={`inline-flex px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${style}`}>
            {status}
        </span>
    );
}
