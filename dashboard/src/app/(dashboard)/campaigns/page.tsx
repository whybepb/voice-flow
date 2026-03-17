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
    voiceMode: 'DEFAULT' | 'PREMIUM';
    agentVoiceOverride: string | null;
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
    voiceMode: string;
    voice: string;
    date: string;
    sent: number;
    connected: number;
    converted: number;
}

interface CsvParseResult {
    headers: string[];
    rows: Record<string, string>[];
}

interface CsvValidationIssue {
    rowNumber: number;
    value: string;
    reason: string;
}

interface CsvValidationReport {
    validNumbers: string[];
    invalidRows: CsvValidationIssue[];
    totalRows: number;
}

function parseCsvToObjects(csvText: string): CsvParseResult {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = '';
    let inQuotes = false;

    for (let i = 0; i < csvText.length; i++) {
        const char = csvText[i];
        const nextChar = csvText[i + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                currentCell += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
            continue;
        }

        if (char === ',' && !inQuotes) {
            currentRow.push(currentCell.trim());
            currentCell = '';
            continue;
        }

        if ((char === '\n' || char === '\r') && !inQuotes) {
            if (char === '\r' && nextChar === '\n') {
                i++;
            }
            currentRow.push(currentCell.trim());
            if (currentRow.some((cell) => cell.length > 0)) {
                rows.push(currentRow);
            }
            currentRow = [];
            currentCell = '';
            continue;
        }

        currentCell += char;
    }

    if (currentCell.length > 0 || currentRow.length > 0) {
        currentRow.push(currentCell.trim());
        if (currentRow.some((cell) => cell.length > 0)) {
            rows.push(currentRow);
        }
    }

    if (rows.length === 0) {
        return { headers: [], rows: [] };
    }

    const headers = rows[0].map((header, idx) => header || `column_${idx + 1}`);
    const dataRows = rows.slice(1).map((row) => {
        const result: Record<string, string> = {};
        headers.forEach((header, idx) => {
            result[header] = (row[idx] || '').trim();
        });
        return result;
    });

    return { headers, rows: dataRows };
}

function normalizeToE164(rawValue: string): { ok: true; value: string } | { ok: false; reason: string } {
    const cleaned = rawValue.trim();
    if (!cleaned) return { ok: false, reason: 'Empty phone number' };

    let candidate = cleaned.replace(/[\s\-().]/g, '');
    if (candidate.startsWith('00')) {
        candidate = `+${candidate.slice(2)}`;
    }

    if (!candidate.startsWith('+')) {
        if (/^\d{10}$/.test(candidate)) {
            candidate = `+1${candidate}`;
        } else if (/^\d{11,15}$/.test(candidate)) {
            candidate = `+${candidate}`;
        } else {
            return { ok: false, reason: 'Missing country code (+)' };
        }
    }

    if (!/^\+[1-9]\d{7,14}$/.test(candidate)) {
        return { ok: false, reason: 'Not a valid E.164 number' };
    }

    return { ok: true, value: candidate };
}

function detectPhoneColumn(headers: string[]): string {
    const preferred = headers.find((header) => /phone|mobile|contact|number|tel|whatsapp/i.test(header));
    return preferred || headers[0] || '';
}

export default function CampaignsPage() {
    const [campaigns, setCampaigns] = useState<TableCampaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [campaignName, setCampaignName] = useState('');
    const [campaignType, setCampaignType] = useState('Appointment Reminder');
    const [voiceMode, setVoiceMode] = useState<'default' | 'premium'>('default');
    const [campaignVoiceOverride, setCampaignVoiceOverride] = useState('inherit');
    const [manualNumbers, setManualNumbers] = useState('');
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
    const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);
    const [phoneColumn, setPhoneColumn] = useState('');
    const [csvReport, setCsvReport] = useState<CsvValidationReport | null>(null);
    const [csvError, setCsvError] = useState<string | null>(null);
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
                    voiceMode: c.voiceMode === 'PREMIUM' ? 'Premium' : 'Default',
                    voice: c.agentVoiceOverride || 'Inherited',
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

    const buildCsvReport = (rows: Record<string, string>[], selectedColumn: string): CsvValidationReport => {
        const validNumbers: string[] = [];
        const invalidRows: CsvValidationIssue[] = [];

        rows.forEach((row, idx) => {
            const rawValue = row[selectedColumn] || '';
            const normalized = normalizeToE164(rawValue);
            if (normalized.ok) {
                validNumbers.push(normalized.value);
            } else {
                invalidRows.push({
                    rowNumber: idx + 2, // +2 because row 1 is header and idx starts at 0
                    value: rawValue,
                    reason: normalized.reason,
                });
            }
        });

        return {
            validNumbers: Array.from(new Set(validNumbers)),
            invalidRows,
            totalRows: rows.length,
        };
    };

    const handleCsvFileChange = async (file: File | null) => {
        setCsvFile(file);
        setCsvError(null);
        setCsvHeaders([]);
        setCsvRows([]);
        setPhoneColumn('');
        setCsvReport(null);

        if (!file) return;

        try {
            const text = await file.text();
            const parsed = parseCsvToObjects(text);

            if (parsed.headers.length === 0) {
                setCsvError('CSV is empty or invalid.');
                return;
            }

            if (parsed.rows.length === 0) {
                setCsvError('CSV has headers but no data rows.');
                return;
            }

            const detectedPhoneColumn = detectPhoneColumn(parsed.headers);
            setCsvHeaders(parsed.headers);
            setCsvRows(parsed.rows);
            setPhoneColumn(detectedPhoneColumn);
            setCsvReport(buildCsvReport(parsed.rows, detectedPhoneColumn));
        } catch (error) {
            console.error('Error parsing CSV', error);
            setCsvError('Failed to parse CSV file.');
        }
    };

    const handleCreateCampaign = async () => {
        if (!campaignName.trim()) {
            alert('Please enter a campaign name');
            return;
        }

        setIsSubmitting(true);
        const manualValid: string[] = [];
        const manualInvalid: string[] = [];

        if (manualNumbers.trim()) {
            const manualParsed = manualNumbers
                .split(/[\n,;]+/)
                .map((value) => value.trim())
                .filter(Boolean);

            manualParsed.forEach((value) => {
                const normalized = normalizeToE164(value);
                if (normalized.ok) {
                    manualValid.push(normalized.value);
                } else {
                    manualInvalid.push(value);
                }
            });
        }

        if (csvFile && csvError) {
            alert(`CSV error: ${csvError}`);
            setIsSubmitting(false);
            return;
        }

        if (csvFile && (!phoneColumn || !csvReport)) {
            alert('Please select a phone column from the CSV.');
            setIsSubmitting(false);
            return;
        }

        const csvValid = csvReport?.validNumbers || [];
        const phoneNumbers = Array.from(new Set([...manualValid, ...csvValid]));

        if (phoneNumbers.length === 0) {
            alert('Please provide at least one phone number via CSV or manual entry');
            setIsSubmitting(false);
            return;
        }

        const invalidCsvCount = csvReport?.invalidRows.length || 0;
        if (manualInvalid.length > 0 || invalidCsvCount > 0) {
            alert(
                `Skipped invalid rows: manual (${manualInvalid.length}), CSV (${invalidCsvCount}). Valid numbers to call: ${phoneNumbers.length}.`
            );
        }

        try {
            const createRes = await api.post('/campaigns', {
                name: campaignName,
                type: campaignType,
                phoneNumbers,
                voiceMode,
                agentVoiceOverride: campaignVoiceOverride === 'inherit' ? null : campaignVoiceOverride,
            });

            // Start the campaign immediately
            const campaignId = createRes.campaign?.id;
            if (campaignId) {
                await api.post(`/campaigns/${campaignId}/start`, {});
            }

            setModalOpen(false);
            setCampaignName('');
            setVoiceMode('default');
            setCampaignVoiceOverride('inherit');
            setManualNumbers('');
            setCsvFile(null);
            setCsvHeaders([]);
            setCsvRows([]);
            setPhoneColumn('');
            setCsvReport(null);
            setCsvError(null);
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
        { label: 'Active Campaigns', value: String(activeCampaigns), icon: Megaphone, iconClass: 'bg-indigo-500/10 text-indigo-500' },
        { label: 'Calls Completed', value: String(totalConnected), icon: CheckCircle, iconClass: 'bg-emerald-500/10 text-emerald-500' },
        { label: 'Pending Calls', value: String(totalPending), icon: Clock, iconClass: 'bg-amber-500/10 text-amber-500' },
        { label: 'Failed Connection', value: failRate, icon: AlertTriangle, iconClass: 'bg-rose-500/10 text-rose-500' },
    ];

    const columns = [
        { header: 'Campaign Name', accessor: 'name', render: (row: TableCampaign) => <span className="font-medium text-foreground">{row.name}</span> },
        { header: 'Type', accessor: 'type' },
        { header: 'Mode', accessor: 'voiceMode' },
        { header: 'Voice', accessor: 'voice' },
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
                            <div className={`p-3 rounded-xl ${stat.iconClass}`}>
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[13px] font-semibold text-foreground/80 mb-2">Call Quality Mode</label>
                            <div className="relative">
                                <select
                                    value={voiceMode}
                                    onChange={(e) => {
                                        setVoiceMode(e.target.value as 'default' | 'premium');
                                    }}
                                    className="w-full px-4 py-3 bg-white/5 rounded-xl border border-white/5 text-sm text-foreground outline-none focus:border-primary/50 cursor-pointer transition-all appearance-none">
                                    <option value="default">Default (gpt-realtime-mini)</option>
                                    <option value="premium">Premium (gpt-realtime)</option>
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </div>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-2">
                                Default keeps call costs lower. Premium uses the higher-quality realtime model for campaign calls.
                            </p>
                        </div>
                        <div>
                            <label className="block text-[13px] font-semibold text-foreground/80 mb-2">Campaign Voice</label>
                            <div className="relative">
                                <select
                                    value={campaignVoiceOverride}
                                    onChange={(e) => setCampaignVoiceOverride(e.target.value)}
                                    className="w-full px-4 py-3 bg-white/5 rounded-xl border border-white/5 text-sm text-foreground outline-none focus:border-primary/50 cursor-pointer transition-all appearance-none">
                                    <option value="inherit">Use account default voice</option>
                                    <option value="cedar">Cedar (Recommended default)</option>
                                    <option value="marin">Marin (Recommended premium)</option>
                                    <option value="ash">Ash</option>
                                    <option value="coral">Coral</option>
                                    <option value="echo">Echo</option>
                                    <option value="sage">Sage</option>
                                    <option value="shimmer">Shimmer</option>
                                    <option value="alloy">Alloy</option>
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </div>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-2">
                                Leave this on the account default unless you want this campaign to sound different.
                            </p>
                        </div>
                    </div>
                    <div>
                        <label className="block text-[13px] font-semibold text-foreground/80 mb-2">Target Audience (CSV)</label>
                        <label className="w-full border border-dashed border-white/20 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-white/5 cursor-pointer transition-colors group">
                            <input
                                type="file"
                                accept=".csv"
                                className="hidden"
                                onChange={(e) => {
                                    void handleCsvFileChange(e.target.files?.[0] || null);
                                }}
                            />
                            <div className="p-3 bg-white/5 rounded-full mb-3 group-hover:scale-110 transition-transform">
                                <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                            </div>
                            <span className="text-sm font-medium text-foreground">
                                {csvFile ? csvFile.name : 'Click to upload CSV'}
                            </span>
                            {!csvFile && <span className="text-xs text-muted-foreground mt-1">or drag and drop</span>}
                        </label>
                        {csvError && (
                            <p className="text-xs text-rose-400 mt-2">{csvError}</p>
                        )}
                        {csvHeaders.length > 0 && (
                            <div className="mt-3">
                                <label className="block text-[12px] font-semibold text-foreground/80 mb-2">Phone Number Column</label>
                                <select
                                    value={phoneColumn}
                                    onChange={(e) => {
                                        const selected = e.target.value;
                                        setPhoneColumn(selected);
                                        setCsvReport(buildCsvReport(csvRows, selected));
                                    }}
                                    className="w-full px-3 py-2 bg-white/5 rounded-lg border border-white/10 text-sm text-foreground outline-none focus:border-primary/50"
                                >
                                    {csvHeaders.map((header) => (
                                        <option key={header} value={header}>
                                            {header}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                        {csvReport && (
                            <div className="mt-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                                <p className="text-xs text-foreground/90">
                                    Rows: {csvReport.totalRows} | Valid: {csvReport.validNumbers.length} | Invalid: {csvReport.invalidRows.length}
                                </p>
                                {csvReport.invalidRows.length > 0 && (
                                    <p className="text-xs text-amber-400 mt-1">
                                        Invalid row samples: {csvReport.invalidRows
                                            .slice(0, 3)
                                            .map((row) => `#${row.rowNumber} (${row.value || 'empty'}: ${row.reason})`)
                                            .join(', ')}
                                    </p>
                                )}
                            </div>
                        )}
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
