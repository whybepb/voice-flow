'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    CalendarDays,
    Users,
    PhoneCall,
    BarChart3,
    Settings,
    LogOut,
    Mic,
    X,
    FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Bookings', href: '/bookings', icon: CalendarDays },
    { name: 'Customers', href: '/customers', icon: Users },
    { name: 'Call Campaigns', href: '/campaigns', icon: PhoneCall },
    { name: 'Call Logs', href: '/call-logs', icon: FileText },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Settings', href: '/settings', icon: Settings },
];

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();
    const [isHovered, setIsHovered] = useState(false);

    // Sidebar is visible if manually opened OR hovered
    const isVisible = isOpen || isHovered;

    return (
        <>
            {/* Hover Trigger Area (Left Edge) */}
            <div
                className="fixed left-0 top-0 bottom-0 w-6 z-40 bg-transparent hover:bg-transparent"
                onMouseEnter={() => setIsHovered(true)}
            />

            {/* Mobile Overlay (Only for manual open on mobile) */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <motion.aside
                className={cn(
                    "fixed left-0 top-0 bottom-0 w-[260px] glass-panel border-r border-white/5 z-50 flex flex-col transition-transform duration-300",
                    isVisible ? "translate-x-0" : "-translate-x-full"
                )}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Header */}
                <div className="h-[72px] flex items-center justify-between px-6 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-violet-500 shadow-lg shadow-primary/20">
                            <Mic className="w-5 h-5 text-white" />
                            <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-card rounded-full" />
                        </div>
                        <div>
                            <h1 className="text-base font-bold text-white tracking-tight">VoiceFlow</h1>
                            <p className="text-[11px] text-muted-foreground font-medium">AI Booking Agent</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-muted-foreground hover:text-white lg:hidden">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
                    <div className="px-3 mb-2">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Navigation</p>
                    </div>

                    {navigation.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link key={item.name} href={item.href} onClick={() => { onClose(); setIsHovered(false); }} className="block relative group">
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute inset-0 bg-primary/10 rounded-xl"
                                        transition={{ type: 'spring', duration: 0.5 }}
                                    />
                                )}
                                <div className={cn(
                                    "relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors duration-200",
                                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                                )}>
                                    <item.icon className={cn("w-5 h-5 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                                    <span className="text-[13px] font-medium">{item.name}</span>
                                    {isActive && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                                        />
                                    )}
                                </div>
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-white/5">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-b from-white/5 to-transparent border border-white/5 hover:border-white/10 transition-colors cursor-pointer group">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-white/5 group-hover:scale-105 transition-transform">
                            <span className="text-xs font-bold text-indigo-400">PB</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-medium text-white truncate">Prathmesh B.</p>
                            <p className="text-[11px] text-muted-foreground truncate">Admin</p>
                        </div>
                        <LogOut className="w-4 h-4 text-muted-foreground group-hover:text-red-400 transition-colors" />
                    </div>
                </div>
            </motion.aside>
        </>
    );
}
