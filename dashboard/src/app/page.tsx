'use client';

import React from 'react';
import StatCard from '@/components/StatCard';
import Chart from '@/components/Chart';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { Calendar, Users, PhoneCall, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import { FadeIn, StaggerContainer } from '@/components/ui/Motion';
import { bookings, stats } from '@/lib/data';

export default function DashboardPage() {
  const chartData = [
    { month: 'Sep', value: 78 },
    { month: 'Oct', value: 82 },
    { month: 'Nov', value: 79 },
    { month: 'Dec', value: 85 },
    { month: 'Jan', value: 89 },
    { month: 'Feb', value: 84 },
  ];

  const columns = [
    { header: 'Name', accessor: 'name' },
    { header: 'Service', accessor: 'service' },
    { header: 'Appointment', accessor: 'appointmentTime' },
    { header: 'Status', accessor: 'status', render: (row: any) => <StatusBadge status={row.status} /> },
    { header: 'Call Status', accessor: 'callStatus', render: (row: any) => <StatusBadge status={row.callStatus} /> },
  ];

  return (
    <StaggerContainer className="space-y-8">
      {/* Header */}
      <FadeIn>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1.5">Overview of your booking automation platform</p>
      </FadeIn>

      {/* Stats Grid */}
      <FadeIn>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <StatCard
            title="Total Bookings Today"
            value={stats.appointmentsToday}
            trend="up"
            trendValue="12% from last week"
            icon={Calendar}
            color="primary"
          />
          <StatCard
            title="Confirmed"
            value={stats.confirmedCount}
            trend="up"
            trendValue="8% from last week"
            icon={TrendingUp}
            color="emerald"
          />
          <StatCard
            title="Pending Confirmations"
            value={stats.pendingCount}
            trend="neutral"
            trendValue="3% from last week"
            icon={Clock}
            color="amber"
          />
          <StatCard
            title="Rescheduled"
            value={stats.rescheduledCount}
            trend="up"
            trendValue="2% from last week"
            icon={Clock}
            color="violet"
          />
          <StatCard
            title="Failed Calls"
            value={stats.failedCalls}
            trend="down"
            trendValue="5% from last week"
            icon={AlertCircle}
            color="rose"
          />
          <StatCard
            title="Total Customers"
            value={stats.totalCustomers}
            trend="up"
            trendValue="6% from last week"
            icon={Users}
            color="primary"
          />
        </div>
      </FadeIn>

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <FadeIn direction="left" delay={0.2} className="lg:col-span-2">
          <div className="rounded-2xl border border-white/5 bg-white/5 p-6 backdrop-blur-sm h-full flex flex-col justify-center">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-foreground">Confirmation Rate</h3>
              <span className="text-2xl font-bold text-emerald-400">84.5%</span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-emerald-300 h-3 rounded-full" style={{ width: '84.5%' }} />
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
                <p className="text-2xl font-bold text-foreground mt-1">3</p>
              </div>
              <div className="flex gap-1">
                <span className="px-2 py-1 rounded-md bg-amber-500/20 text-amber-400 text-[10px] font-bold border border-amber-500/20">2 scheduled</span>
                <span className="px-2 py-1 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">1 in progress</span>
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
            <DataTable
              data={bookings}
              columns={columns}
              searchPlaceholder="Search bookings..."
              pageSize={5}
            />
          </div>
        </FadeIn>

        <FadeIn delay={0.5}>
          <Chart
            data={chartData}
            dataKey="value"
            title="Call Volume"
            subtitle="Calls made over last 6 months"
            type="area"
            height={320}
          />
        </FadeIn>
      </div>
    </StaggerContainer>
  );
}
