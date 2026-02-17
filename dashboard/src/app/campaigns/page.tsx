'use client';

import React, { useState } from 'react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import { campaigns } from '@/lib/data';
import { Campaign } from '@/lib/data';
import { FadeIn, StaggerContainer } from '@/components/ui/Motion';
import { Plus, Megaphone, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

export default function CampaignsPage() {
    const [modalOpen, setModalOpen] = useState(false);

    const columns = [
        { header: 'Campaign Name', accessor: 'name', render: (row: Campaign) => <span className="font-medium text-foreground">{row.name}</span> },
        { header: 'Type', accessor: 'type' },
        { header: 'Status', accessor: 'status', render: (row: Campaign) => <StatusBadge status={row.status} /> },
        { header: 'Sent', accessor: 'sent' },
        { header: 'Connected', accessor: 'connected' },
        { header: 'Converted', accessor: 'converted' },
    ];

    return (
        <StaggerContainer className="space-y-8">
            {/* Header */}
            <FadeIn className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">Call Campaigns</h1>
                    <p className="text-sm text-muted-foreground mt-1.5">Manage automated voice outreach campaigns</p>
                </div>
                <Button onClick={() => setModalOpen(true)} className="shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow">
                    <Plus className="w-4 h-4 mr-2" />
                    New Campaign
                </Button>
            </FadeIn>

            {/* Campaign Stats */}
            <FadeIn delay={0.1}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {[
                        { label: 'Active Campaigns', value: '3', icon: Megaphone, color: 'primary' },
                        { label: 'Calls Completed', value: '1,248', icon: CheckCircle, color: 'emerald' },
                        { label: 'Pending Calls', value: '432', icon: Clock, color: 'amber' },
                        { label: 'Failed Connection', value: '12%', icon: AlertTriangle, color: 'rose' },
                    ].map((stat, i) => (
                        <div key={i} className="rounded-2xl border border-white/5 bg-card/40 p-6 backdrop-blur-sm flex items-center gap-4 hover:border-white/10 transition-colors">
                            <div className={`p-3 rounded-xl bg-${stat.color === 'primary' ? 'indigo' : stat.color}-500/10 text-${stat.color === 'primary' ? 'indigo' : stat.color}-500`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                                <h3 className="text-2xl font-bold text-foreground mt-0.5">{stat.value}</h3>
                            </div>
                        </div>
                    ))}
                </div>
            </FadeIn>

            <FadeIn delay={0.2}>
                <DataTable<Campaign>
                    data={campaigns}
                    columns={columns}
                    searchPlaceholder="Search campaigns..."
                    searchKeys={['name', 'type']}
                    filterKey="status"
                    filterOptions={['Completed', 'In Progress', 'Scheduled', 'Failed']}
                    pageSize={10}
                />
            </FadeIn>

            {/* New Campaign Modal */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Start New Campaign">
                <div className="space-y-5">
                    <div>
                        <label className="block text-[13px] font-semibold text-foreground/80 mb-2">Campaign Name</label>
                        <input
                            type="text"
                            placeholder="e.g., Summer Promo Recall"
                            className="w-full px-4 py-3 bg-white/5 rounded-xl border border-white/5 text-sm text-foreground outline-none focus:border-primary/50 focus:bg-white/10 transition-all placeholder:text-muted-foreground/40"
                        />
                    </div>
                    <div>
                        <label className="block text-[13px] font-semibold text-foreground/80 mb-2">Campaign Type</label>
                        <div className="relative">
                            <select className="w-full px-4 py-3 bg-white/5 rounded-xl border border-white/5 text-sm text-foreground outline-none focus:border-primary/50 cursor-pointer transition-all appearance-none">
                                <option>Appointment Reminder</option>
                                <option>Recall / Reactivation</option>
                                <option>Feedback Request</option>
                                <option>Custom Promo</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-[13px] font-semibold text-foreground/80 mb-2">Target Audience (CSV)</label>
                        <div className="w-full border border-dashed border-white/20 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-white/5 cursor-pointer transition-colors group">
                            <div className="p-3 bg-white/5 rounded-full mb-3 group-hover:scale-110 transition-transform">
                                <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                            </div>
                            <span className="text-sm font-medium text-foreground">Click to upload CSV</span>
                            <span className="text-xs text-muted-foreground mt-1">or drag and drop</span>
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Button variant="outline" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
                        <Button className="flex-1">Create Campaign</Button>
                    </div>
                </div>
            </Modal>
        </StaggerContainer>
    );
}
