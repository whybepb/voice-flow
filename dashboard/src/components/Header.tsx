'use client';

import React from 'react';

interface HeaderProps {
    onMenuToggle: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
    return (
        <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-header/80 backdrop-blur-xl border-b border-border">
            {/* Left: Mobile menu + Search */}
            <div className="flex items-center gap-3">
                <button
                    onClick={onMenuToggle}
                    className="md:hidden p-2 rounded-lg hover:bg-card text-muted hover:text-foreground cursor-pointer"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>

                {/* Search */}
                <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-card rounded-lg border border-border w-72">
                    <svg className="w-4 h-4 text-muted flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search anything..."
                        className="bg-transparent text-sm text-foreground placeholder:text-muted outline-none w-full"
                    />
                    <kbd className="hidden lg:inline-flex px-1.5 py-0.5 text-[10px] font-medium text-muted bg-background rounded border border-border">⌘K</kbd>
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
                {/* Notification bell */}
                <button className="relative p-2 rounded-lg hover:bg-card text-muted hover:text-foreground cursor-pointer">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary animate-pulse" />
                </button>

                {/* Divider */}
                <div className="w-px h-6 bg-border mx-1" />

                {/* User avatar */}
                <button className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-card cursor-pointer">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                        PB
                    </div>
                    <span className="hidden md:block text-sm font-medium text-foreground">Prathmesh</span>
                    <svg className="hidden md:block w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
            </div>
        </header>
    );
}
