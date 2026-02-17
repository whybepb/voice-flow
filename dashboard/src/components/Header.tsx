'use client';

import React from 'react';

interface HeaderProps {
    onMenuToggle: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
    return (
        <header className="sticky top-0 z-30 flex items-center justify-between h-[72px] px-6 lg:px-8 bg-header/90 backdrop-blur-xl border-b border-border">
            {/* Left side */}
            <div className="flex items-center gap-4">
                {/* Mobile hamburger */}
                <button
                    onClick={onMenuToggle}
                    className="p-2 rounded-xl hover:bg-card text-muted hover:text-foreground cursor-pointer transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>

                {/* Search */}
                <div className="hidden sm:flex items-center gap-3 px-4 py-2.5 bg-card/60 rounded-xl border border-border/60 w-80 hover:border-border transition-colors">
                    <svg className="w-4 h-4 text-muted flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search anything..."
                        className="bg-transparent text-sm text-foreground placeholder:text-muted/60 outline-none w-full"
                    />
                    <kbd className="hidden lg:inline-flex px-2 py-0.5 text-[10px] font-semibold text-muted/50 bg-background/60 rounded-md border border-border/60">⌘K</kbd>
                </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
                {/* Notification */}
                <button className="relative p-2.5 rounded-xl hover:bg-card text-muted hover:text-foreground cursor-pointer transition-colors">
                    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-header" />
                </button>

                <div className="w-px h-8 bg-border/60 mx-1" />

                {/* User */}
                <button className="flex items-center gap-3 py-1.5 px-2 rounded-xl hover:bg-card cursor-pointer transition-colors">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-violet-500/20 flex-shrink-0">
                        PB
                    </div>
                    <div className="hidden md:block text-left">
                        <p className="text-[13px] font-semibold text-foreground leading-tight">Prathmesh</p>
                        <p className="text-[11px] text-muted leading-tight">Admin</p>
                    </div>
                </button>
            </div>
        </header>
    );
}
