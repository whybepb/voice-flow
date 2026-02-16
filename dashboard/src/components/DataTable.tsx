'use client';

import React, { useState, useMemo } from 'react';

export interface Column<T> {
    key: string;
    header: string;
    render?: (item: T) => React.ReactNode;
    sortable?: boolean;
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    searchPlaceholder?: string;
    searchKeys?: string[];
    filterKey?: string;
    filterOptions?: string[];
    pageSize?: number;
}

export default function DataTable<T extends Record<string, any>>({
    data,
    columns,
    searchPlaceholder = 'Search...',
    searchKeys = [],
    filterKey,
    filterOptions = [],
    pageSize = 10,
}: DataTableProps<T>) {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);

    const filteredData = useMemo(() => {
        let result = data;

        // Search
        if (search && searchKeys.length > 0) {
            const q = search.toLowerCase();
            result = result.filter((item) =>
                searchKeys.some((key) =>
                    String(item[key] ?? '').toLowerCase().includes(q)
                )
            );
        }

        // Filter
        if (filter !== 'All' && filterKey) {
            result = result.filter((item) => item[filterKey] === filter);
        }

        return result;
    }, [data, search, searchKeys, filter, filterKey]);

    const totalPages = Math.ceil(filteredData.length / pageSize);
    const paginatedData = filteredData.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    return (
        <div className="space-y-4">
            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="flex items-center gap-2 px-3 py-2 bg-card rounded-lg border border-border flex-1">
                    <svg className="w-4 h-4 text-muted flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder={searchPlaceholder}
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                        className="bg-transparent text-sm text-foreground placeholder:text-muted outline-none w-full"
                    />
                </div>

                {/* Filter */}
                {filterOptions.length > 0 && (
                    <select
                        value={filter}
                        onChange={(e) => { setFilter(e.target.value); setCurrentPage(1); }}
                        className="px-3 py-2 bg-card rounded-lg border border-border text-sm text-foreground outline-none cursor-pointer"
                    >
                        <option value="All">All Status</option>
                        {filterOptions.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-card/50">
                            {columns.map((col) => (
                                <th key={col.key} className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {paginatedData.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="px-4 py-8 text-center text-muted">
                                    No results found
                                </td>
                            </tr>
                        ) : (
                            paginatedData.map((item, idx) => (
                                <tr key={idx} className="hover:bg-card/30 transition-colors">
                                    {columns.map((col) => (
                                        <td key={col.key} className="px-4 py-3 text-foreground whitespace-nowrap">
                                            {col.render ? col.render(item) : String(item[col.key] ?? '')}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between text-sm">
                    <p className="text-muted">
                        Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length}
                    </p>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1.5 rounded-lg bg-card border border-border text-muted hover:text-foreground disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`px-3 py-1.5 rounded-lg cursor-pointer ${page === currentPage
                                    ? 'bg-primary text-white'
                                    : 'bg-card border border-border text-muted hover:text-foreground'
                                    }`}
                            >
                                {page}
                            </button>
                        ))}
                        <button
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1.5 rounded-lg bg-card border border-border text-muted hover:text-foreground disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
