'use client';

import React from 'react';
import DataTable, { Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { customers, Customer } from '@/lib/data';

const columns: Column<Customer>[] = [
    {
        key: 'name',
        header: 'Name',
        render: (item) => (
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500/30 to-indigo-500/30 border border-violet-500/20 flex items-center justify-center text-xs font-bold text-violet-300">
                    {item.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <div>
                    <p className="font-medium text-foreground">{item.name}</p>
                    <p className="text-xs text-muted">{item.id}</p>
                </div>
            </div>
        ),
    },
    {
        key: 'email',
        header: 'Email',
        render: (item) => <span className="text-muted">{item.email}</span>,
    },
    { key: 'phone', header: 'Phone' },
    {
        key: 'totalBookings',
        header: 'Total Bookings',
        render: (item) => <span className="font-medium text-foreground">{item.totalBookings}</span>,
    },
    {
        key: 'lastBooking',
        header: 'Last Booking',
        render: (item) => <span className="text-muted">{item.lastBooking}</span>,
    },
    {
        key: 'status',
        header: 'Status',
        render: (item) => <StatusBadge status={item.status} />,
    },
];

export default function CustomersPage() {
    return (
        <div className="space-y-6">
            {/* Page header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Customers</h1>
                    <p className="text-sm text-muted mt-1">View and manage your customer database</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted">
                    <span className="px-2.5 py-1 rounded-lg bg-card border border-border">
                        {customers.length} customers
                    </span>
                </div>
            </div>

            {/* Customers Table */}
            <DataTable<Customer>
                data={customers}
                columns={columns}
                searchPlaceholder="Search by name, email, or phone..."
                searchKeys={['name', 'email', 'phone']}
                filterKey="status"
                filterOptions={['Active', 'Inactive']}
                pageSize={10}
            />
        </div>
    );
}
