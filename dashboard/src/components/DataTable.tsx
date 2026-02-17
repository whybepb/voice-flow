'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '@/components/Button';
import { Search, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DataTableProps<T> {
    data: T[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    columns: any[];
    searchPlaceholder?: string;
    searchKeys?: (keyof T)[];
    filterKey?: keyof T;
    filterOptions?: string[];
    pageSize?: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function DataTable<T extends Record<string, any>>({
    data,
    columns,
    searchPlaceholder = 'Search...',
    searchKeys = [],
    filterKey,
    filterOptions = [],
    pageSize = 10,
}: DataTableProps<T>) {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterValue, setFilterValue] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    // Filter logic
    const filteredData = data.filter((item) => {
        const matchesSearch = searchKeys.length > 0
            ? searchKeys.some((key) =>
                String(item[key]).toLowerCase().includes(searchTerm.toLowerCase())
            )
            : true;
        const matchesFilter = filterKey && filterValue
            ? item[filterKey] === filterValue
            : true;
        return matchesSearch && matchesFilter;
    });

    // Pagination logic
    const totalPages = Math.ceil(filteredData.length / pageSize);
    const paginatedData = filteredData.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    return (
        <div className="space-y-4">
            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative w-full sm:w-72 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder={searchPlaceholder}
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        className="w-full pl-9 pr-4 py-2 bg-card/40 border border-white/5 rounded-xl text-sm text-foreground focus:border-primary/50 focus:bg-card/60 outline-none transition-all placeholder:text-muted-foreground/50"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => { setSearchTerm(''); setCurrentPage(1); }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    )}
                </div>

                {filterKey && filterOptions.length > 0 && (
                    <div className="flex gap-2 items-center">
                        {filterOptions.map((option) => (
                            <button
                                key={option}
                                onClick={() => {
                                    setFilterValue(filterValue === option ? '' : option);
                                    setCurrentPage(1);
                                }}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                                    filterValue === option
                                        ? "bg-primary/20 text-primary border-primary/30"
                                        : "bg-card/40 text-muted-foreground border-white/5 hover:bg-white/5 hover:text-foreground"
                                )}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-card/40 backdrop-blur-sm shadow-xl shadow-black/20">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white/5 border-b border-white/5">
                            <tr>
                                {columns.map((col, idx) => (
                                    <th key={idx} className="px-6 py-4 font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                                        {col.header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            <AnimatePresence mode="wait">
                                {paginatedData.length > 0 ? (
                                    paginatedData.map((row, rowIndex) => (
                                        <motion.tr
                                            key={rowIndex}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ delay: rowIndex * 0.03, duration: 0.2 }}
                                            className="group hover:bg-white/[0.02] transition-colors"
                                        >
                                            {columns.map((col, colIndex) => (
                                                <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-foreground/90 group-hover:text-foreground transition-colors">
                                                    {col.render ? col.render(row) : row[col.accessor]}
                                                </td>
                                            ))}
                                        </motion.tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={columns.length} className="px-6 py-12 text-center text-muted-foreground">
                                            No results found
                                        </td>
                                    </tr>
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="bg-white/[0.02] px-6 py-4 border-t border-white/5 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                            Showing <span className="font-medium text-foreground">{((currentPage - 1) * pageSize) + 1}</span> to <span className="font-medium text-foreground">{Math.min(currentPage * pageSize, filteredData.length)}</span> of <span className="font-medium text-foreground">{filteredData.length}</span>
                        </span>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="h-8 w-8 p-0"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="h-8 w-8 p-0"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
