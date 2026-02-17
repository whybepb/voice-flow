'use client';

import React from 'react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { customers } from '@/lib/data';
import { Customer } from '@/lib/data';
import { FadeIn, StaggerContainer } from '@/components/ui/Motion';

export default function CustomersPage() {
    const columns = [
        {
            header: 'Customer',
            accessor: 'name',
            render: (row: Customer) => (
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 flex items-center justify-center border border-white/5 text-sm font-bold text-emerald-400">
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
        { header: 'Last Contact', accessor: 'lastContact' },
        {
            header: 'Total Bookings', accessor: 'totalBookings', render: (row: Customer) => (
                <span className="font-mono text-sm">{row.totalBookings}</span>
            )
        },
        { header: 'Status', accessor: 'status', render: (row: Customer) => <StatusBadge status={row.status} /> },
    ];

    return (
        <StaggerContainer className="space-y-8">
            <FadeIn>
                <h1 className="text-3xl font-bold text-foreground tracking-tight">Customers</h1>
                <p className="text-sm text-muted-foreground mt-1.5">View and manage your customer base</p>
            </FadeIn>

            <FadeIn delay={0.1}>
                <DataTable<Customer>
                    data={customers}
                    columns={columns}
                    searchPlaceholder="Search by name, email, or phone..."
                    searchKeys={['name', 'email', 'phone']}
                    filterKey="status"
                    filterOptions={['Active', 'Inactive']}
                    pageSize={10}
                />
            </FadeIn>
        </StaggerContainer>
    );
}
