'use client';

import React, { useEffect, useState } from 'react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import { FadeIn, StaggerContainer } from '@/components/ui/Motion';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { Plus, Megaphone, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';

interface CampaignData {
    id: string;
    name: string;
    type: string;
    status: string;
    createdAt: string;
    bookings: {
        id: string;
        status: string;
        lastCallStatus: string | null;
    }[];
}

interface TableCampaign {
    id: string;
    name: string;
    type: string;
    status: string;
    date: string;
    sent: number;
    connected: number;
    converted: number;
}

export default function CampaignsPage() {
    const [campaigns, setCampaigns] = useState<TableCampaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [campaignName, setCampaignName] = useState('');
    const [campaignType, setCampaignType] = useState('Appointment Reminder');
    const [manualNumbers, setManualNumbers] = useState('');
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchCampaigns = async () => {
        try {
            const res = await api.get('/campaigns');
            const fetched: TableCampaign[] = (res.campaigns || []).map((c: CampaignData) => {
                const totalBookings = c.bookings?.length || 0;
                const connected = c.bookings?.filter(
                    (b) => b.lastCallStatus && !['queued', 'initiated', 'ringing'].includes(b.lastCallStatus.toLowerCase())
                ).length || 0;
                const converted = c.bookings?.filter(
                    (b) => b.status === 'CONFIRMED'
                ).length || 0;

                return {
                    id: c.id,
                    name: c.name,
                    type: c.type,
                    status: c.status,
                    date: new Date(c.createdAt).toLocaleDateString(),
                    sent: totalBookings,
                    connected,
                    converted,
                };
            });
            setCampaigns(fetched);
        } catch (error) {
            console.error('Error fetching campaigns:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const handleCreateCampaign = async () => {
        if (!campaignName.trim()) {
            alert('Please enter a campaign name');
            return;
        }

        setIsSubmitting(true);
        let phoneNumbers: string[] = [];

        // Parse manual numbers
        if (manualNumbers.trim()) {
            const manualParsed = manualNumbers.split(/[\n,;]+/).map(n => n.trim()).filter(n => n);
            phoneNumbers = [...phoneNumbers, ...manualParsed];
        }

        // Parse CSV
        if (csvFile) {
            try {
                const text = await csvFile.text();
                const csvParsed = text.split(/[\n\r]+/).flatMap(line => line.split(',')).map(n => n.trim()).filter(n => n);
                phoneNumbers = [...phoneNumbers, ...csvParsed];
            } catch (e) {
                console.error('Error parsing CSV', e);
                alert('Failed to parse CSV file');
                setIsSubmitting(false);
                return;
            }
        }

        // Deduplicate
        phoneNumbers = Array.from(new Set(phoneNumbers));

        if (phoneNumbers.length === 0) {
            alert('Please provide at least one phone number via CSV or manual entry');
            setIsSubmitting(false);
            return;
        }

        try {
            const createRes = await api.post('/campaigns', {
                name: campaignName,
                type: campaignType,
                phoneNumbers
            });

            // Start the campaign immediately
            const campaignId = createRes.campaign?.id;
            if (campaignId) {
                await api.post(`/campaigns/${campaignId}/start`, {});
            }

            setModalOpen(false);
            setCampaignName('');
            setManualNumbers('');
            setCsvFile(null);
            alert('Campaign created and started successfully!');

            // Refresh the list
            fetchCampaigns();
        } catch (error) {
            console.error('Error creating or starting campaign', error);
            alert('Failed to create or start campaign');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Stats computed from real data
    const activeCampaigns = campaigns.filter(c => c.status === 'RUNNING').length;
    const totalSent = campaigns.reduce((acc, c) => acc + c.sent, 0);
    const totalPending = campaigns.filter(c => c.status === 'DRAFT').reduce((acc, c) => acc + c.sent, 0);
    const totalConnected = campaigns.reduce((acc, c) => acc + c.connected, 0);
    const failRate = totalSent > 0 ? `${Math.round(((totalSent - totalConnected) / totalSent) * 100)}%` : '0%';

    const statCards = [
        { label: 'Active Campaigns', value: String(activeCampaigns), icon: Megaphone, color: 'primary' },
        { label: 'Calls Completed', value: String(totalConnected), icon: CheckCircle, color: 'emerald' },
        { label: 'Pending Calls', value: String(totalPending), icon: Clock, color: 'amber' },
        { label: 'Failed Connection', value: failRate, icon: AlertTriangle, color: 'rose' },
    ];

    const columns = [
        { header: 'Campaign Name', accessor: 'name', render: (row: TableCampaign) => <span className="font-medium text-foreground">{row.name}</span> },
        { header: 'Type', accessor: 'type' },
        { header: 'Status', accessor: 'status', render: (row: TableCampaign) => <StatusBadge status={row.status} /> },
        { header: 'Sent', accessor: 'sent' },
        { header: 'Connected', accessor: 'connected' },
        { header: 'Converted', accessor: 'converted' },
    ];

    if (loading) return <PageSkeleton />;

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
                    {statCards.map((stat, i) => (
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
                {campaigns.length > 0 ? (
                    <DataTable<TableCampaign>
                        data={campaigns}
                        columns={columns}
                        searchPlaceholder="Search campaigns..."
                        searchKeys={['name', 'type']}
                        filterKey="status"
                        filterOptions={['COMPLETED', 'RUNNING', 'DRAFT', 'PAUSED']}
                        pageSize={10}
                    />
                ) : (
                    <div className="rounded-2xl border border-white/5 bg-white/5 p-12 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center mx-auto mb-4">
                            <Megaphone className="w-7 h-7 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">No campaigns yet</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">
                            Create a new campaign to start making AI calls
                        </p>
                    </div>
                )}
            </FadeIn>

            {/* New Campaign Modal */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Start New Campaign">
                <div className="space-y-5">
                    <div>
                        <label className="block text-[13px] font-semibold text-foreground/80 mb-2">Campaign Name</label>
                        <input
                            type="text"
                            value={campaignName}
                            onChange={(e) => setCampaignName(e.target.value)}
                            placeholder="e.g., Summer Promo Recall"
                            className="w-full px-4 py-3 bg-white/5 rounded-xl border border-white/5 text-sm text-foreground outline-none focus:border-primary/50 focus:bg-white/10 transition-all placeholder:text-muted-foreground/40"
                        />
                    </div>
                    <div>
                        <label className="block text-[13px] font-semibold text-foreground/80 mb-2">Campaign Type</label>
                        <div className="relative">
                            <select
                                value={campaignType}
                                onChange={(e) => setCampaignType(e.target.value)}
                                className="w-full px-4 py-3 bg-white/5 rounded-xl border border-white/5 text-sm text-foreground outline-none focus:border-primary/50 cursor-pointer transition-all appearance-none">
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
                        <label className="w-full border border-dashed border-white/20 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-white/5 cursor-pointer transition-colors group">
                            <input
                                type="file"
                                accept=".csv"
                                className="hidden"
                                onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                            />
                            <div className="p-3 bg-white/5 rounded-full mb-3 group-hover:scale-110 transition-transform">
                                <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                            </div>
                            <span className="text-sm font-medium text-foreground">
                                {csvFile ? csvFile.name : 'Click to upload CSV'}
                            </span>
                            {!csvFile && <span className="text-xs text-muted-foreground mt-1">or drag and drop</span>}
                        </label>
                    </div>
                    <div>
                        <label className="block text-[13px] font-semibold text-foreground/80 mb-2">Or Enter Numbers Manually</label>
                        <textarea
                            value={manualNumbers}
                            onChange={(e) => setManualNumbers(e.target.value)}
                            placeholder={"Enter phone numbers separated by commas or newlines\ne.g. +1234567890, +0987654321"}
                            className="w-full px-4 py-3 bg-white/5 rounded-xl border border-white/5 text-sm text-foreground outline-none focus:border-primary/50 focus:bg-white/10 transition-all placeholder:text-muted-foreground/40 min-h-[100px] resize-y"
                        />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Button variant="outline" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
                        <Button className="flex-1" onClick={handleCreateCampaign} disabled={isSubmitting}>
                            {isSubmitting ? 'Creating...' : 'Create Campaign'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </StaggerContainer>
    );
}
