'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FadeIn, StaggerContainer } from '@/components/ui/Motion';
import { PageSkeleton } from '@/components/ui/Skeleton';
import {
    BookOpen,
    Upload,
    FileText,
    Trash2,
    RefreshCw,
    Search,
    CheckCircle2,
    Clock,
    AlertCircle,
    X,
    FileUp,
    Sparkles,
} from 'lucide-react';
import { api } from '@/lib/api';

// ─── Types ──────────────────────────────────────────────────────────

interface KnowledgeDoc {
    id: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    status: 'PROCESSING' | 'READY' | 'FAILED';
    chunkCount: number;
    createdAt: string;
    updatedAt: string;
}

interface SearchResult {
    chunkId: string;
    content: string;
    chunkIndex: number;
    documentId: string;
    fileName: string;
    similarity: number;
}

interface QueryResponse {
    query: string;
    results: SearchResult[];
    ragPrompt: string;
    sources: { fileName: string; chunkIndex: number; similarity: number }[];
    answer?: string;
}

// ─── Helpers ────────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

const statusConfig = {
    PROCESSING: { label: 'Processing', icon: Clock },
    READY: { label: 'Ready', icon: CheckCircle2 },
    FAILED: { label: 'Failed', icon: AlertCircle },
};

const statusStyles = {
    PROCESSING: { wrapper: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-400' },
    READY: { wrapper: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-400' },
    FAILED: { wrapper: 'bg-red-500/10 border-red-500/20', text: 'text-red-400' },
};

// ─── Component ──────────────────────────────────────────────────────

export default function KnowledgePage() {
    const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    // Query state
    const [queryText, setQueryText] = useState('');
    const [queryResult, setQueryResult] = useState<QueryResponse | null>(null);
    const [querying, setQuerying] = useState(false);
    const [generateAnswer, setGenerateAnswer] = useState(true);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── Fetch Documents ──────────────────────────────────────────

    const fetchDocs = useCallback(async () => {
        try {
            const res = await api.get('/knowledge');
            setDocs(res.data);
        } catch (error) {
            console.error('Error fetching knowledge docs:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDocs();
    }, [fetchDocs]);

    // Auto-poll for processing docs
    useEffect(() => {
        const hasProcessing = docs.some((d) => d.status === 'PROCESSING');
        if (!hasProcessing) return;

        const interval = setInterval(fetchDocs, 3000);
        return () => clearInterval(interval);
    }, [docs, fetchDocs]);

    // ── Upload ───────────────────────────────────────────────────

    const handleUpload = async (file: File) => {
        setUploadError(null);

        // Client-side validation
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (!ext || !['pdf', 'txt'].includes(ext)) {
            setUploadError('Only .pdf and .txt files are supported.');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setUploadError('File size must be under 5 MB.');
            return;
        }

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            // Can't use api helper since it sets Content-Type to JSON
            let token: string | null = null;
            if (typeof window !== 'undefined') {
                token = localStorage.getItem('voiceflow_token');
            }

            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
            const res = await fetch(`${API_URL}/knowledge/upload`, {
                method: 'POST',
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: formData,
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || 'Upload failed');
            }

            await fetchDocs();
        } catch (error: unknown) {
            setUploadError(error instanceof Error ? error.message : 'Upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(false);
        const file = e.dataTransfer.files[0];
        if (file) handleUpload(file);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleUpload(file);
        e.target.value = ''; // reset input
    };

    // ── Delete ───────────────────────────────────────────────────

    const handleDelete = async (id: string) => {
        try {
            await api.del(`/knowledge/${id}`);
            setDocs((prev) => prev.filter((d) => d.id !== id));
        } catch (error) {
            console.error('Delete failed:', error);
        }
    };

    // ── Reindex ──────────────────────────────────────────────────

    const handleReindex = async (id: string) => {
        try {
            await api.post(`/knowledge/${id}/reindex`, {});
            await fetchDocs();
        } catch (error) {
            console.error('Reindex failed:', error);
        }
    };

    // ── Query ────────────────────────────────────────────────────

    const handleQuery = async () => {
        if (!queryText.trim()) return;
        setQuerying(true);
        setQueryResult(null);

        try {
            const res = await api.post('/knowledge/query', {
                query: queryText.trim(),
                topK: 5,
                generateAnswer,
            });
            setQueryResult(res.data);
        } catch (error) {
            console.error('Query failed:', error);
        } finally {
            setQuerying(false);
        }
    };

    // ── Render ────────────────────────────────────────────────────

    if (loading) return <PageSkeleton />;

    return (
        <StaggerContainer className="space-y-8">
            {/* Header */}
            <FadeIn>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground tracking-tight">Knowledge Base</h1>
                        <p className="text-sm text-muted-foreground mt-1.5">
                            Upload company documents for your AI voice agent to reference during calls
                        </p>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                        <BookOpen className="w-4 h-4 text-indigo-400" />
                        <span className="text-xs font-medium text-muted-foreground">
                            {docs.filter((d) => d.status === 'READY').length} active docs
                        </span>
                    </div>
                </div>
            </FadeIn>

            {/* Upload Area */}
            <FadeIn delay={0.1}>
                <div
                    onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-200 ${dragActive
                        ? 'border-indigo-500 bg-indigo-500/5'
                        : 'border-white/10 hover:border-white/20 bg-white/[0.02] hover:bg-white/[0.04]'
                        }`}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.txt"
                        className="hidden"
                        onChange={handleFileSelect}
                    />

                    {uploading ? (
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center animate-pulse">
                                <Upload className="w-6 h-6 text-indigo-400" />
                            </div>
                            <p className="text-sm font-medium text-white">Uploading...</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-105 transition-transform">
                                <FileUp className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-white">
                                    {dragActive ? 'Drop your file here' : 'Drag & drop or click to upload'}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Supports PDF and TXT files up to 5 MB
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Upload Error */}
                    <AnimatePresence>
                        {uploadError && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="mt-4 flex items-center justify-center gap-2 text-red-400 text-xs"
                            >
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span>{uploadError}</span>
                                <button onClick={(e) => { e.stopPropagation(); setUploadError(null); }}>
                                    <X className="w-3 h-3" />
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </FadeIn>

            {/* Documents Table */}
            <FadeIn delay={0.2}>
                <div className="rounded-2xl border border-white/5 bg-card overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/5">
                        <h2 className="text-sm font-bold text-white">Uploaded Documents</h2>
                    </div>

                    {docs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center mb-4">
                                <FileText className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <p className="text-sm text-muted-foreground">No documents uploaded yet</p>
                            <p className="text-xs text-muted-foreground/60 mt-1">
                                Upload PDFs or TXT files to train your AI agent
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-white/5">
                            {docs.map((doc) => {
                                const status = statusConfig[doc.status];
                                const style = statusStyles[doc.status];
                                const StatusIcon = status.icon;

                                return (
                                    <motion.div
                                        key={doc.id}
                                        layout
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors"
                                    >
                                        {/* Icon */}
                                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center flex-shrink-0">
                                            <FileText className="w-4.5 h-4.5 text-muted-foreground" />
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-white truncate">{doc.fileName}</p>
                                            <div className="flex items-center gap-3 mt-0.5">
                                                <span className="text-[11px] text-muted-foreground uppercase">{doc.fileType}</span>
                                                <span className="text-[11px] text-muted-foreground">{formatFileSize(doc.fileSize)}</span>
                                                {doc.chunkCount > 0 && (
                                                    <span className="text-[11px] text-muted-foreground">{doc.chunkCount} chunks</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Status */}
                                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${style.wrapper}`}>
                                            <StatusIcon className={`w-3 h-3 ${style.text}`} />
                                            <span className={`text-[11px] font-medium ${style.text}`}>{status.label}</span>
                                        </div>

                                        {/* Date */}
                                        <span className="text-[11px] text-muted-foreground hidden sm:block w-32 text-right">
                                            {formatDate(doc.createdAt)}
                                        </span>

                                        {/* Actions */}
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => handleReindex(doc.id)}
                                                disabled={doc.status === 'PROCESSING'}
                                                className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-indigo-400 transition-colors disabled:opacity-30"
                                                title="Re-index"
                                            >
                                                <RefreshCw className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(doc.id)}
                                                className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </FadeIn>

            {/* RAG Query Test Panel */}
            <FadeIn delay={0.3}>
                <div className="rounded-2xl border border-white/5 bg-card overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/5 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-violet-400" />
                        <h2 className="text-sm font-bold text-white">Test Knowledge Search</h2>
                        <span className="text-[11px] text-muted-foreground ml-1">Try a sample query against your docs</span>
                    </div>

                    <div className="p-6">
                        <div className="flex gap-3">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    value={queryText}
                                    onChange={(e) => setQueryText(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
                                    placeholder="Ask a question about your uploaded documents..."
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                                />
                            </div>
                            <button
                                onClick={handleQuery}
                                disabled={querying || !queryText.trim()}
                                className="px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {querying ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Search className="w-4 h-4" />
                                )}
                                Search
                            </button>
                        </div>
                        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                            <input
                                id="kb-generate-answer"
                                type="checkbox"
                                checked={generateAnswer}
                                onChange={(e) => setGenerateAnswer(e.target.checked)}
                                className="h-3.5 w-3.5 rounded border border-white/20 bg-white/5"
                            />
                            <label htmlFor="kb-generate-answer">
                                Generate a concise answer (uses OpenAI)
                            </label>
                        </div>

                        {/* Results */}
                        <AnimatePresence>
                            {queryResult && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="mt-6 space-y-4"
                                >
                                    {/* Answer */}
                                    {queryResult.answer && (
                                        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                                            <p className="text-xs text-muted-foreground mb-2">Answer</p>
                                            <p className="text-sm text-white/90 leading-relaxed">
                                                {queryResult.answer}
                                            </p>
                                        </div>
                                    )}

                                    {/* Sources */}
                                    {queryResult.sources.length > 0 && (
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-[11px] text-muted-foreground font-medium">Sources:</span>
                                            {queryResult.sources.map((s, i) => (
                                                <span
                                                    key={i}
                                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-indigo-300"
                                                >
                                                    <FileText className="w-3 h-3" />
                                                    {s.fileName} (chunk {s.chunkIndex + 1})
                                                    <span className="text-indigo-400/60 ml-1">
                                                        {(s.similarity * 100).toFixed(0)}%
                                                    </span>
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Chunks */}
                                    <div className="space-y-3">
                                        {queryResult.results.map((r) => (
                                            <div
                                                key={r.chunkId}
                                                className="rounded-xl border border-white/5 bg-white/[0.02] p-4"
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-[11px] font-medium text-indigo-400">
                                                        {r.fileName} — Chunk {r.chunkIndex + 1}
                                                    </span>
                                                    <span className="text-[11px] text-muted-foreground">
                                                        {(r.similarity * 100).toFixed(1)}% match
                                                    </span>
                                                </div>
                                                <p className="text-sm text-white/80 leading-relaxed line-clamp-4">
                                                    {r.content}
                                                </p>
                                            </div>
                                        ))}
                                    </div>

                                    {queryResult.results.length === 0 && (
                                        <div className="text-center py-8">
                                            <p className="text-sm text-muted-foreground">No relevant results found</p>
                                            <p className="text-xs text-muted-foreground/60 mt-1">
                                                Try a different query or upload more documents
                                            </p>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </FadeIn>
        </StaggerContainer>
    );
}
