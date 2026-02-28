'use client';

import React, { useEffect, useState } from 'react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { Booking } from '@/lib/data';
import { FadeIn, StaggerContainer } from '@/components/ui/Motion';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { api } from '@/lib/api';

export default function BookingsPage() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const res = await api.get('/bookings');
                //  eslint-disable-next-line @typescript-eslint/no-explicit-any
                const fetchedBookings = res.data.bookings.map((b: any) => ({
                    id: b.id,
                    name: b.customer?.name || 'Unknown',
                    phone: b.customer?.phone || 'N/A',
                    email: b.customer?.email || 'N/A',
                    appointmentTime: new Date(b.appointmentTime).toLocaleString(),
                    status: b.status,
                    callStatus: b.lastCallStatus || 'Pending',
                    service: 'General Consultation', // Placeholder
                    // Adding missing fields from Booking interface if any
                }));
                setBookings(fetchedBookings);
            } catch (error) {
                console.error('Error fetching bookings:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchBookings();
    }, []);

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

    if (loading) return <PageSkeleton />;

    return (
        <StaggerContainer className="space-y-8">
            <FadeIn>
                <h1 className="text-3xl font-bold text-foreground tracking-tight">Bookings</h1>
                <p className="text-sm text-muted-foreground mt-1.5">Manage and track all customer bookings</p>
            </FadeIn>

            <FadeIn delay={0.1}>
                {bookings.length > 0 ? (
                    <DataTable<Booking>
                        data={bookings}
                        columns={columns}
                        searchPlaceholder="Search by name, phone, or email..."
                        searchKeys={['name', 'phone', 'email']}
                        filterKey="status"
                        filterOptions={['Confirmed', 'Pending', 'Cancelled', 'Rescheduled']}
                        pageSize={10}
                    />
                ) : (
                    <div className="text-white">No bookings found.</div>
                )}
            </FadeIn>
        </StaggerContainer>
    );
}
