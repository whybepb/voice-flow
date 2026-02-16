'use client';

import React, { useState } from 'react';
import DataTable, { Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import { campaigns, Campaign } from '@/lib/data';

const columns: Column<Campaign>[] = [
    {
        key: 'name',
        header: 'Campaign Name',
        render: (item) => <span className="font-medium text-foreground">{item.name}</span>,
    },
    {
        key: 'date',
        header: 'Date',
        render: (item) => <span className="text-muted">{item.date}</span>,
    },
    {
        key: 'type',
        header: 'Type',
        render: (item) => (
            <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {item.type}
            </span>
        ),
    },
    {
        key: 'totalCalls',
        header: 'Total Calls',
    },
    {
        key: 'successful',
        header: 'Successful',
        render: (item) => <span className="text-emerald-400 font-medium">{item.successful}</span>,
    },
    {
        key: 'failed',
        header: 'Failed',
        render: (item) => <span className="text-red-400 font-medium">{item.failed}</span>,
    },
    {
        key: 'status',
        header: 'Status',
        render: (item) => <StatusBadge status={item.status} />,
    },
];

export default function CampaignsPage() {
    const [modalOpen, setModalOpen] = useState(false);
    const [campaignStarted, setCampaignStarted] = useState(false);

    const handleStartCampaign = () => {
        setCampaignStarted(true);
        setTimeout(() => {
            setCampaignStarted(false);
            setModalOpen(false);
        }, 2000);
    };

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Call Campaigns</h1>
                    <p className="text-sm text-muted mt-1">Manage and trigger automated confirmation calls</p>
                </div>
                <Button onClick={() => setModalOpen(true)} size="md">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Start New Campaign
                </Button>
            </div>

            {/* Campaign Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="rounded-xl border border-border bg-card/50 p-4 backdrop-blur-sm">
                    <p className="text-xs text-muted font-medium uppercase tracking-wider">Total Campaigns</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{campaigns.length}</p>
                </div>
                <div className="rounded-xl border border-border bg-card/50 p-4 backdrop-blur-sm">
                    <p className="text-xs text-muted font-medium uppercase tracking-wider">Total Calls Made</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{campaigns.reduce((s, c) => s + c.totalCalls, 0)}</p>
                </div>
                <div className="rounded-xl border border-border bg-card/50 p-4 backdrop-blur-sm">
                    <p className="text-xs text-muted font-medium uppercase tracking-wider">Success Rate</p>
                    <p className="text-2xl font-bold text-emerald-400 mt-1">
                        {Math.round(
                            (campaigns.reduce((s, c) => s + c.successful, 0) /
                                campaigns.reduce((s, c) => s + c.totalCalls, 0)) * 100
                        )}%
                    </p>
                </div>
                <div className="rounded-xl border border-border bg-card/50 p-4 backdrop-blur-sm">
                    <p className="text-xs text-muted font-medium uppercase tracking-wider">Active Now</p>
                    <p className="text-2xl font-bold text-amber-400 mt-1">{campaigns.filter((c) => c.status === 'In Progress').length}</p>
                </div>
            </div>

            {/* Campaign History Table */}
            <DataTable<Campaign>
                data={campaigns}
                columns={columns}
                searchPlaceholder="Search campaigns..."
                searchKeys={['name', 'type']}
                filterKey="status"
                filterOptions={['Completed', 'In Progress', 'Scheduled', 'Failed']}
                pageSize={10}
            />

            {/* New Campaign Modal */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Start New Campaign">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">Campaign Name</label>
                        <input
                            type="text"
                            placeholder="e.g. Morning Confirmations"
                            className="w-full px-3 py-2 bg-background rounded-lg border border-border text-sm text-foreground placeholder:text-muted outline-none focus:border-primary"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">Campaign Type</label>
                        <select className="w-full px-3 py-2 bg-background rounded-lg border border-border text-sm text-foreground outline-none focus:border-primary cursor-pointer">
                            <option>Confirmation</option>
                            <option>Reminder</option>
                            <option>Follow-up</option>
                            <option>Rescheduling</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">Target Bookings</label>
                        <select className="w-full px-3 py-2 bg-background rounded-lg border border-border text-sm text-foreground outline-none focus:border-primary cursor-pointer">
                            <option>All Pending Bookings (5)</option>
                            <option>Today&apos;s Bookings (18)</option>
                            <option>Tomorrow&apos;s Bookings (12)</option>
                            <option>Custom Selection</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-3 pt-2">
                        <Button onClick={handleStartCampaign} disabled={campaignStarted}>
                            {campaignStarted ? (
                                <>
                                    <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Starting Campaign...
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    Start Calling
                                </>
                            )}
                        </Button>
                        <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
