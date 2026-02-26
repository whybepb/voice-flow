'use client';

import React, { useEffect, useState } from 'react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import TranscriptViewer from '@/components/TranscriptViewer';
import { FadeIn, StaggerContainer } from '@/components/ui/Motion';
import { api } from '@/lib/api';
import { Phone, Clock, FileText, Bot, PhoneOff, PhoneIncoming } from 'lucide-react';

interface CallLog {
    id: string;
    sid: string | null;
    callStatus: string;
    transcript: string | null;
    recordingUrl: string | null;
    duration: number | null;
    createdAt: string;
    booking: {
        id: string;
        service: string | null;
        status: string;
        customer: {
            name: string;
            phone: string;
            email: string | null;
        };
        campaign: {
            name: string;
        } | null;
    };
}

export default function CallLogsPage() {
    const [callLogs, setCallLogs] = useState<CallLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTranscript, setSelectedTranscript] = useState<{
        transcript: string | null;
        details: { customerName: string; phone: string; duration?: number; status: string; date: string };
    } | null>(null);

    useEffect(() => {
        const fetchCallLogs = async () => {
            try {
                const res = await api.get('/call-logs');
                setCallLogs(res.data.callLogs);
            } catch (error) {
                console.error('Error fetching call logs:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCallLogs();
    }, []);

    const openTranscript = (log: CallLog) => {
        setSelectedTranscript({
            transcript: log.transcript,
            details: {
                customerName: log.booking.customer.name,
                phone: log.booking.customer.phone,
                duration: log.duration ?? undefined,
                status: log.callStatus,
                date: new Date(log.createdAt).toLocaleString(),
            },
        });
    };

    // Transform for the DataTable
    const tableData = callLogs.map((log) => ({
        id: log.id,
        customerName: log.booking.customer.name,
        phone: log.booking.customer.phone,
        campaign: log.booking.campaign?.name || '—',
        callStatus: log.callStatus,
        duration: log.duration ? `${Math.floor(log.duration / 60)}m ${log.duration % 60}s` : '—',
        hasTranscript: !!log.transcript,
        date: new Date(log.createdAt).toLocaleString(),
        _raw: log,
    }));

    // Stats
    const totalCalls = callLogs.length;
    const completedCalls = callLogs.filter((l) => l.callStatus?.toLowerCase() === 'completed').length;
    const failedCalls = callLogs.filter((l) => ['failed', 'busy', 'no-answer', 'canceled'].includes(l.callStatus?.toLowerCase())).length;
    const withTranscripts = callLogs.filter((l) => l.transcript).length;
    const avgDuration = callLogs.filter((l) => l.duration).reduce((acc, l) => acc + (l.duration || 0), 0) / (callLogs.filter((l) => l.duration).length || 1);

    const columns = [
        {
            header: 'Customer',
            accessor: 'customerName',
            render: (row: any) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary/20 to-violet-500/20 flex items-center justify-center border border-white/5 text-xs font-bold text-primary">
                        {row.customerName.split(' ').map((n: string) => n[0]).join('')}
                    </div>
                    <div>
                        <p className="font-medium text-foreground text-sm">{row.customerName}</p>
                        <p className="text-[11px] text-muted-foreground">{row.phone}</p>
                    </div>
                </div>
            ),
        },
        { header: 'Campaign', accessor: 'campaign' },
        {
            header: 'Status',
            accessor: 'callStatus',
            render: (row: any) => <StatusBadge status={row.callStatus} />,
        },
        { header: 'Duration', accessor: 'duration' },
        { header: 'Date', accessor: 'date' },
        {
            header: 'Transcript',
            accessor: 'hasTranscript',
            render: (row: any) => (
                <button
                    onClick={() => openTranscript(row._raw)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${row.hasTranscript
                            ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 hover:scale-105'
                            : 'bg-white/5 text-muted-foreground border border-white/5 cursor-default'
                        }`}
                    disabled={!row.hasTranscript}
                >
                    <FileText className="w-3.5 h-3.5" />
                    {row.hasTranscript ? 'View' : 'None'}
                </button>
            ),
        },
    ];

    if (loading) return <div className="text-white">Loading...</div>;

    return (
        <StaggerContainer className="space-y-8">
            <FadeIn>
                <h1 className="text-3xl font-bold text-foreground tracking-tight">Call Logs</h1>
                <p className="text-sm text-muted-foreground mt-1.5">
                    View AI call history, transcripts, and outcomes
                </p>
            </FadeIn>

            {/* Stats Row */}
            <FadeIn delay={0.1}>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="rounded-2xl border border-white/5 bg-white/5 p-5 backdrop-blur-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <Phone className="w-4 h-4 text-indigo-400" />
                            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Total Calls</span>
                        </div>
                        <p className="text-2xl font-bold text-white">{totalCalls}</p>
                    </div>
                    <div className="rounded-2xl border border-white/5 bg-emerald-500/5 p-5 backdrop-blur-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <PhoneIncoming className="w-4 h-4 text-emerald-400" />
                            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Completed</span>
                        </div>
                        <p className="text-2xl font-bold text-emerald-400">{completedCalls}</p>
                    </div>
                    <div className="rounded-2xl border border-white/5 bg-red-500/5 p-5 backdrop-blur-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <PhoneOff className="w-4 h-4 text-red-400" />
                            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Failed</span>
                        </div>
                        <p className="text-2xl font-bold text-red-400">{failedCalls}</p>
                    </div>
                    <div className="rounded-2xl border border-white/5 bg-violet-500/5 p-5 backdrop-blur-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <Bot className="w-4 h-4 text-violet-400" />
                            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Transcripts</span>
                        </div>
                        <p className="text-2xl font-bold text-violet-400">{withTranscripts}</p>
                    </div>
                </div>
            </FadeIn>

            {/* Table */}
            <FadeIn delay={0.2}>
                {tableData.length > 0 ? (
                    <DataTable
                        data={tableData}
                        columns={columns}
                        searchPlaceholder="Search by customer name or phone..."
                        searchKeys={['customerName', 'phone']}
                        filterKey="callStatus"
                        filterOptions={['completed', 'initiated', 'ringing', 'busy', 'no-answer', 'failed', 'canceled', 'queued']}
                        pageSize={10}
                    />
                ) : (
                    <div className="rounded-2xl border border-white/5 bg-white/5 p-12 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center mx-auto mb-4">
                            <Phone className="w-7 h-7 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">No call logs yet</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">
                            Call logs will appear here once AI campaigns start making calls
                        </p>
                    </div>
                )}
            </FadeIn>

            {/* Transcript Viewer */}
            <TranscriptViewer
                isOpen={!!selectedTranscript}
                onClose={() => setSelectedTranscript(null)}
                transcript={selectedTranscript?.transcript || null}
                callDetails={selectedTranscript?.details}
            />
        </StaggerContainer>
    );
}
