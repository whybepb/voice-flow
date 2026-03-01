'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import { Search, Loader2, LayoutDashboard, Users, Calendar, Megaphone, FileText, Settings } from 'lucide-react';
import { api } from '@/lib/api';

interface SearchResults {
    customers: Array<{ id: string; name: string; email: string; phone: string }>;
    campaigns: Array<{ id: string; name: string; type: string; status: string }>;
    knowledge: Array<{ id: string; fileName: string; fileType: string; status: string }>;
}

export default function CommandPalette() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<SearchResults | null>(null);
    const router = useRouter();

    // Toggle the menu when ⌘K is pressed
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener('keydown', down);
        // Expose a custom event so the Header search bar click can open this
        const openEvent = () => setOpen(true);
        document.addEventListener('openCommandPalette', openEvent);

        return () => {
            document.removeEventListener('keydown', down);
            document.removeEventListener('openCommandPalette', openEvent);
        };
    }, []);

    // Debounced search API call
    useEffect(() => {
        if (!query.trim()) {
            setResults(null);
            return;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await api.get(`/search?q=${encodeURIComponent(query)}`);
                setResults(res.data);
            } catch (err) {
                console.error('Search error:', err);
            } finally {
                setLoading(false);
            }
        }, 300); // 300ms debounce

        return () => clearTimeout(timer);
    }, [query]);

    const runCommand = (command: () => void) => {
        setOpen(false);
        command();
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-32 bg-background/80 backdrop-blur-sm px-4">
            <div
                className="fixed inset-0 z-0"
                onClick={() => setOpen(false)}
            />

            <Command
                className="relative z-10 w-full max-w-2xl bg-card border border-border shadow-2xl rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                shouldFilter={false} // We handle filtering server-side and manually
            >
                <div className="flex items-center px-4 py-3 border-b border-border gap-3">
                    <Search className="w-5 h-5 text-muted-foreground" />
                    <Command.Input
                        value={query}
                        onValueChange={setQuery}
                        placeholder="Search customers, campaigns, documents, or jump to page..."
                        className="flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
                        autoFocus
                    />
                    {loading && <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />}
                    <kbd className="hidden lg:inline-flex px-2 py-0.5 text-[10px] font-semibold text-muted-foreground/50 bg-white/5 rounded-md border border-white/5">ESC</kbd>
                </div>

                <Command.List className="max-h-[350px] overflow-y-auto p-2 scroll-smooth">
                    {query.trim().length === 0 && (
                        <Command.Group heading="Navigation" className="px-2 text-xs font-semibold text-muted-foreground pt-2">
                            <Command.Item
                                onSelect={() => runCommand(() => router.push('/'))}
                                className="flex items-center gap-3 px-3 py-2.5 mt-1 text-sm text-foreground rounded-xl cursor-pointer hover:bg-white/5 aria-selected:bg-white/5 transition-colors"
                            >
                                <LayoutDashboard className="w-4 h-4 text-indigo-400" />
                                <span>Dashboard</span>
                            </Command.Item>
                            <Command.Item
                                onSelect={() => runCommand(() => router.push('/customers'))}
                                className="flex items-center gap-3 px-3 py-2.5 mt-1 text-sm text-foreground rounded-xl cursor-pointer hover:bg-white/5 aria-selected:bg-white/5 transition-colors"
                            >
                                <Users className="w-4 h-4 text-emerald-400" />
                                <span>Customers</span>
                            </Command.Item>
                            <Command.Item
                                onSelect={() => runCommand(() => router.push('/bookings'))}
                                className="flex items-center gap-3 px-3 py-2.5 mt-1 text-sm text-foreground rounded-xl cursor-pointer hover:bg-white/5 aria-selected:bg-white/5 transition-colors"
                            >
                                <Calendar className="w-4 h-4 text-blue-400" />
                                <span>Bookings</span>
                            </Command.Item>
                            <Command.Item
                                onSelect={() => runCommand(() => router.push('/campaigns'))}
                                className="flex items-center gap-3 px-3 py-2.5 mt-1 text-sm text-foreground rounded-xl cursor-pointer hover:bg-white/5 aria-selected:bg-white/5 transition-colors"
                            >
                                <Megaphone className="w-4 h-4 text-rose-400" />
                                <span>Campaigns</span>
                            </Command.Item>
                            <Command.Item
                                onSelect={() => runCommand(() => router.push('/knowledge'))}
                                className="flex items-center gap-3 px-3 py-2.5 mt-1 text-sm text-foreground rounded-xl cursor-pointer hover:bg-white/5 aria-selected:bg-white/5 transition-colors"
                            >
                                <FileText className="w-4 h-4 text-amber-400" />
                                <span>Knowledge Base</span>
                            </Command.Item>
                            <Command.Item
                                onSelect={() => runCommand(() => router.push('/settings'))}
                                className="flex items-center gap-3 px-3 py-2.5 mt-1 text-sm text-foreground rounded-xl cursor-pointer hover:bg-white/5 aria-selected:bg-white/5 transition-colors"
                            >
                                <Settings className="w-4 h-4 text-slate-400" />
                                <span>Settings</span>
                            </Command.Item>
                        </Command.Group>
                    )}

                    {!loading && results && (results.customers.length === 0 && results.campaigns.length === 0 && results.knowledge.length === 0) && query.length > 0 && (
                        <Command.Empty className="py-12 text-center text-sm text-muted-foreground">
                            No results found for &quot;{query}&quot;.
                        </Command.Empty>
                    )}

                    {results?.customers.length ? (
                        <Command.Group heading="Customers" className="px-2 text-xs font-semibold text-muted-foreground pt-4">
                            {results.customers.map((c) => (
                                <Command.Item
                                    key={c.id}
                                    onSelect={() => runCommand(() => router.push('/customers'))}
                                    className="flex items-center justify-between px-3 py-2.5 mt-1 text-sm text-foreground rounded-xl cursor-pointer hover:bg-white/5 aria-selected:bg-white/5 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 flex items-center justify-center border border-white/5 text-xs font-bold text-emerald-500">
                                            {c.name.charAt(0)}
                                        </div>
                                        <div className="flex flex-col">
                                            <span>{c.name}</span>
                                            <span className="text-[11px] text-muted-foreground">{c.email || c.phone}</span>
                                        </div>
                                    </div>
                                    <span className="text-[11px] text-muted-foreground/50 border border-white/5 rounded px-2 py-0.5">Jump</span>
                                </Command.Item>
                            ))}
                        </Command.Group>
                    ) : null}

                    {results?.campaigns.length ? (
                        <Command.Group heading="Campaigns" className="px-2 text-xs font-semibold text-muted-foreground pt-4">
                            {results.campaigns.map((c) => (
                                <Command.Item
                                    key={c.id}
                                    onSelect={() => runCommand(() => router.push('/campaigns'))}
                                    className="flex items-center justify-between px-3 py-2.5 mt-1 text-sm text-foreground rounded-xl cursor-pointer hover:bg-white/5 aria-selected:bg-white/5 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                            <Megaphone className="w-4 h-4" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span>{c.name}</span>
                                            <span className="text-[11px] text-muted-foreground capitalize">{c.type.toLowerCase()} • {c.status}</span>
                                        </div>
                                    </div>
                                    <span className="text-[11px] text-muted-foreground/50 border border-white/5 rounded px-2 py-0.5">Jump</span>
                                </Command.Item>
                            ))}
                        </Command.Group>
                    ) : null}

                    {results?.knowledge.length ? (
                        <Command.Group heading="Knowledge Base" className="px-2 text-xs font-semibold text-muted-foreground pt-4">
                            {results.knowledge.map((k) => (
                                <Command.Item
                                    key={k.id}
                                    onSelect={() => runCommand(() => router.push('/knowledge'))}
                                    className="flex items-center justify-between px-3 py-2.5 mt-1 text-sm text-foreground rounded-xl cursor-pointer hover:bg-white/5 aria-selected:bg-white/5 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                            <FileText className="w-4 h-4" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span>{k.fileName}</span>
                                            <span className="text-[11px] text-muted-foreground uppercase">{k.fileType}</span>
                                        </div>
                                    </div>
                                    <span className="text-[11px] text-muted-foreground/50 border border-white/5 rounded px-2 py-0.5">Jump</span>
                                </Command.Item>
                            ))}
                        </Command.Group>
                    ) : null}

                </Command.List>
            </Command>
        </div>
    );
}
