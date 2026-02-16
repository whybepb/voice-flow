'use client';

import React from 'react';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';
import { dashboardStats, bookings } from '@/lib/data';

export default function DashboardPage() {
  const recentBookings = bookings.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted mt-1">Overview of your booking automation platform</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard
          title="Total Bookings Today"
          value={dashboardStats.totalBookingsToday}
          color="primary"
          trend={{ value: 12, isPositive: true }}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
        <StatCard
          title="Confirmed"
          value={dashboardStats.confirmed}
          color="success"
          trend={{ value: 8, isPositive: true }}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          title="Pending"
          value={dashboardStats.pending}
          color="warning"
          trend={{ value: 3, isPositive: false }}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          title="Rescheduled"
          value={dashboardStats.rescheduled}
          color="info"
          trend={{ value: 2, isPositive: true }}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          }
        />
        <StatCard
          title="Failed Calls"
          value={dashboardStats.failedCalls}
          color="danger"
          trend={{ value: 5, isPositive: false }}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          }
        />
      </div>

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Confirmation Rate */}
        <div className="rounded-xl border border-border bg-card/50 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Confirmation Rate</h3>
            <span className="text-2xl font-bold text-emerald-400">{dashboardStats.confirmationRate}%</span>
          </div>
          <div className="w-full h-2 bg-background rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-1000"
              style={{ width: `${dashboardStats.confirmationRate}%` }}
            />
          </div>
        </div>

        {/* Total Customers */}
        <div className="rounded-xl border border-border bg-card/50 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Total Customers</h3>
            <span className="text-2xl font-bold text-indigo-400">{dashboardStats.totalCustomers}</span>
          </div>
          <p className="text-xs text-muted">+12 new customers this week</p>
        </div>

        {/* Active Campaigns */}
        <div className="rounded-xl border border-border bg-card/50 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Active Campaigns</h3>
            <span className="text-2xl font-bold text-violet-400">3</span>
          </div>
          <p className="text-xs text-muted">2 scheduled for tomorrow</p>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Recent Bookings</h3>
          <a href="/bookings" className="text-xs text-primary hover:text-primary-hover font-medium">
            View all →
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-card/30">
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Name</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Service</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Time</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Call Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-card/30 transition-colors">
                  <td className="px-5 py-3 font-medium text-foreground">{booking.name}</td>
                  <td className="px-5 py-3 text-muted">{booking.service}</td>
                  <td className="px-5 py-3 text-muted">{booking.appointmentTime}</td>
                  <td className="px-5 py-3"><StatusBadge status={booking.status} /></td>
                  <td className="px-5 py-3"><StatusBadge status={booking.callStatus} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
