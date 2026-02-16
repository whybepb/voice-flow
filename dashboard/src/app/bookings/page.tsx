'use client';

import React from 'react';
import DataTable, { Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { bookings, Booking } from '@/lib/data';

const columns: Column<Booking>[] = [
    {
        key: 'name',
        header: 'Name',
        render: (item) => (
            <div>
                <p className="font-medium text-foreground">{item.name}</p>
                <p className="text-xs text-muted">{item.email}</p>
            </div>
        ),
    },
    { key: 'phone', header: 'Phone' },
    {
        key: 'appointmentTime',
        header: 'Appointment Time',
        render: (item) => <span className="text-muted">{item.appointmentTime}</span>,
    },
    {
        key: 'service',
        header: 'Service',
        render: (item) => <span className="text-muted">{item.service}</span>,
    },
    {
        key: 'status',
        header: 'Status',
        render: (item) => <StatusBadge status={item.status} />,
    },
    {
        key: 'callStatus',
        header: 'Last Call Status',
        render: (item) => <StatusBadge status={item.callStatus} />,
    },
];

export default function BookingsPage() {
    return (
        <div className="space-y-6">
            {/* Page header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Bookings</h1>
                    <p className="text-sm text-muted mt-1">Manage and track all customer bookings</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted">
                    <span className="px-2.5 py-1 rounded-lg bg-card border border-border">
                        {bookings.length} total bookings
                    </span>
                </div>
            </div>

            {/* Bookings Table */}
            <DataTable<Booking>
                data={bookings}
                columns={columns}
                searchPlaceholder="Search by name or phone..."
                searchKeys={['name', 'phone', 'email']}
                filterKey="status"
                filterOptions={['Confirmed', 'Pending', 'Cancelled', 'Rescheduled']}
                pageSize={10}
            />
        </div>
    );
}
