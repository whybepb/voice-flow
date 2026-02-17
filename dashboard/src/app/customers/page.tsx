'use client';

import React, { useEffect, useState } from 'react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { Customer } from '@/lib/data';
import { FadeIn, StaggerContainer } from '@/components/ui/Motion';
import { api } from '@/lib/api';

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const res = await api.get('/customers');
                const fetchedCustomers = res.data.customers.map((c: any) => {
                    const bookings = c.bookings || [];
                    const lastBooking = bookings.length > 0
                        ? new Date(bookings[bookings.length - 1].appointmentTime).toLocaleDateString()
                        : 'Never';

                    return {
                        id: c.id,
                        name: c.name,
                        email: c.email || 'N/A',
                        phone: c.phone,
                        totalBookings: bookings.length,
                        lastBooking: lastBooking,
                        status: 'Active', // Placeholder
                        lastContact: 'Unknown' // Placeholder
                    };
                });
                setCustomers(fetchedCustomers);
            } catch (error) {
                console.error('Error fetching customers:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCustomers();
    }, []);

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

    if (loading) return <div className="text-white">Loading...</div>;

    return (
        <StaggerContainer className="space-y-8">
            <FadeIn>
                <h1 className="text-3xl font-bold text-foreground tracking-tight">Customers</h1>
                <p className="text-sm text-muted-foreground mt-1.5">View and manage your customer base</p>
            </FadeIn>

            <FadeIn delay={0.1}>
                {customers.length > 0 ? (
                    <DataTable<Customer>
                        data={customers}
                        columns={columns}
                        searchPlaceholder="Search by name, email, or phone..."
                        searchKeys={['name', 'email', 'phone']}
                        filterKey="status"
                        filterOptions={['Active', 'Inactive']}
                        pageSize={10}
                    />
                ) : (
                    <div className="text-white">No customers found.</div>
                )}
            </FadeIn>
        </StaggerContainer>
    );
}
