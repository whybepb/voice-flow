'use client';

import React from 'react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { bookings } from '@/lib/data';
import { Booking } from '@/lib/data';
import { FadeIn, StaggerContainer } from '@/components/ui/Motion';

export default function BookingsPage() {
    const columns = [
        {
            header: 'Name',
            accessor: 'name',
            render: (row: Booking) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary/20 to-violet-500/20 flex items-center justify-center border border-white/5 text-xs font-bold text-primary">
                        {row.name.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div>
                        <p className="font-medium text-foreground">{row.name}</p>
                        <p className="text-[11px] text-muted-foreground">{row.email}</p>
                    </div>
                </div>
            )
        },
        { header: 'Phone', accessor: 'phone' },
        { header: 'Appointment', accessor: 'appointmentTime' },
        {
            header: 'Service', accessor: 'service', render: (row: Booking) => (
                <span className="inline-flex px-2 py-1 rounded-md bg-white/5 border border-white/5 text-[11px] font-medium text-muted-foreground">
                    {row.service}
                </span>
            )
        },
        { header: 'Status', accessor: 'status', render: (row: Booking) => <StatusBadge status={row.status} /> },
        { header: 'Call Status', accessor: 'callStatus', render: (row: Booking) => <StatusBadge status={row.callStatus} /> },
    ];

    return (
        <StaggerContainer className="space-y-8">
            <FadeIn>
                <h1 className="text-3xl font-bold text-foreground tracking-tight">Bookings</h1>
                <p className="text-sm text-muted-foreground mt-1.5">Manage and track all customer bookings</p>
            </FadeIn>

            <FadeIn delay={0.1}>
                <DataTable<Booking>
                    data={bookings}
                    columns={columns}
                    searchPlaceholder="Search by name, phone, or email..."
                    searchKeys={['name', 'phone', 'email']}
                    filterKey="status"
                    filterOptions={['Confirmed', 'Pending', 'Cancelled', 'Rescheduled']}
                    pageSize={10}
                />
            </FadeIn>
        </StaggerContainer>
    );
}
