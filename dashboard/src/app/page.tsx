'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import DashboardShell from '@/components/DashboardShell';
import StatCard from '@/components/StatCard';
import Chart from '@/components/Chart';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { Calendar, Users, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import { FadeIn, StaggerContainer } from '@/components/ui/Motion';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { api } from '@/lib/api';
import { Booking, DashboardStats } from '@/lib/data';

export default function HomePage() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.replace('/landing');
      } else if (user && !user.onboardingComplete) {
        router.replace('/onboarding');
      }
    }
  }, [isAuthenticated, authLoading, user, router]);

  if (authLoading || !isAuthenticated || (user && !user.onboardingComplete)) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardShell>
      <DashboardContent />
    </DashboardShell>
  );
}

function DashboardContent() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    appointmentsToday: 0,
    confirmedCount: 0,
    pendingCount: 0,
    rescheduledCount: 0,
    failedCalls: 0,
    totalCustomers: 0,
    confirmationRate: 0,
  });
  const [chartData, setChartData] = useState<{ month: string; value: number }[]>([]);
  const [campaignSummary, setCampaignSummary] = useState({ active: 0, scheduled: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bookingsRes, customersRes, analyticsRes] = await Promise.all([
          api.get('/bookings'),
          api.get('/customers'),
          api.get('/analytics/dashboard'),
        ]);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fetchedBookings = bookingsRes.data.bookings.map((b: any) => ({
          id: b.id,
          name: b.customer?.name || 'Unknown',
          phone: b.customer?.phone || 'N/A',
          email: b.customer?.email || 'N/A',
          appointmentTime: new Date(b.appointmentTime).toLocaleString(),
          status: b.status,
          callStatus: b.lastCallStatus || 'Pending',
          service: b.service || 'General Consultation',
        }));

        setBookings(fetchedBookings);

        const confirmed = fetchedBookings.filter((b: Record<string, string>) => b.status === 'CONFIRMED').length;
        const pending = fetchedBookings.filter((b: Record<string, string>) => b.status === 'PENDING').length;
        const rescheduled = fetchedBookings.filter((b: Record<string, string>) => b.status === 'RESCHEDULED').length;
        const failed = fetchedBookings.filter((b: Record<string, string>) => b.callStatus?.toLowerCase() === 'failed').length;
        const totalCustomers = customersRes.results;
        const today = new Date().toDateString();
        const todayAppointments = fetchedBookings.filter((b: Record<string, string>) => new Date(b.appointmentTime).toDateString() === today).length;

        setStats({
          appointmentsToday: todayAppointments,
          confirmedCount: confirmed,
          pendingCount: pending,
          rescheduledCount: rescheduled,
          failedCalls: failed,
          totalCustomers: totalCustomers,
          confirmationRate: fetchedBookings.length > 0 ? (confirmed / fetchedBookings.length) * 100 : 0,
        });

        if (analyticsRes.monthly?.callVolume) {
          setChartData(analyticsRes.monthly.callVolume);
        }

        if (analyticsRes.campaignSummary) {
          setCampaignSummary({
            active: analyticsRes.campaignSummary.active || 0,
            scheduled: analyticsRes.campaignSummary.scheduled || 0,
          });
        }

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const columns = [
    { header: 'Name', accessor: 'name' },
    { header: 'Service', accessor: 'service' },
    { header: 'Appointment', accessor: 'appointmentTime' },
    { header: 'Status', accessor: 'status', render: (row: Record<string, string>) => <StatusBadge status={row.status} /> },
    { header: 'Call Status', accessor: 'callStatus', render: (row: Record<string, string>) => <StatusBadge status={row.callStatus} /> },
  ];

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <StaggerContainer className="space-y-8">
      <FadeIn>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1.5">Overview of your booking automation platform</p>
      </FadeIn>

      <FadeIn>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <StatCard title="Total Bookings Today" value={stats.appointmentsToday} trend="up" trendValue="Calculated from real data" icon={Calendar} color="primary" />
          <StatCard title="Confirmed" value={stats.confirmedCount} trend="up" trendValue="Real-time" icon={TrendingUp} color="emerald" />
          <StatCard title="Pending Confirmations" value={stats.pendingCount} trend="neutral" trendValue="Real-time" icon={Clock} color="amber" />
          <StatCard title="Rescheduled" value={stats.rescheduledCount} trend="up" trendValue="Real-time" icon={Clock} color="violet" />
          <StatCard title="Failed Calls" value={stats.failedCalls} trend="down" trendValue="Real-time" icon={AlertCircle} color="rose" />
          <StatCard title="Total Customers" value={stats.totalCustomers} trend="up" trendValue="Real-time" icon={Users} color="primary" />
        </div>
      </FadeIn>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <FadeIn direction="left" delay={0.2} className="lg:col-span-2">
          <div className="rounded-2xl border border-white/5 bg-white/5 p-6 backdrop-blur-sm h-full flex flex-col justify-center">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-foreground">Confirmation Rate</h3>
              <span className="text-2xl font-bold text-emerald-400">{stats.confirmationRate.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-emerald-300 h-3 rounded-full" style={{ width: `${stats.confirmationRate}%` }} />
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">Based on AI call outcomes</p>
          </div>
        </FadeIn>

        <FadeIn direction="right" delay={0.3}>
          <div className="rounded-2xl border border-white/5 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 p-6 backdrop-blur-sm">
            <h3 className="text-sm font-semibold text-foreground mb-4">Active Campaigns</h3>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-foreground">Running right now</span>
                <p className="text-2xl font-bold text-foreground mt-1">{campaignSummary.active + campaignSummary.scheduled}</p>
              </div>
              <div className="flex gap-1">
                <span className="px-2 py-1 rounded-md bg-amber-500/20 text-amber-400 text-[10px] font-bold border border-amber-500/20">{campaignSummary.scheduled} scheduled</span>
                <span className="px-2 py-1 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">{campaignSummary.active} in progress</span>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <FadeIn delay={0.4} className="lg:col-span-2">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">Recent Bookings</h2>
              <button className="text-xs text-primary hover:text-primary/80 transition-colors font-medium">View all →</button>
            </div>
            <DataTable data={bookings} columns={columns} searchPlaceholder="Search bookings..." pageSize={5} />
          </div>
        </FadeIn>

        <FadeIn delay={0.5}>
          <Chart data={chartData} dataKey="value" title="Call Volume" subtitle="Calls made over last 6 months" type="area" height={320} />
        </FadeIn>
      </div>
    </StaggerContainer>
  );
}
