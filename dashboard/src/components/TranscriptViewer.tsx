'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Bot, Clock, Phone } from 'lucide-react';

interface TranscriptViewerProps {
    isOpen: boolean;
    onClose: () => void;
    transcript: string | null;
    callDetails?: {
        customerName?: string;
        phone?: string;
        duration?: number;
        status?: string;
        date?: string;
    };
}

export default function TranscriptViewer({ isOpen, onClose, transcript, callDetails }: TranscriptViewerProps) {
    if (!isOpen) return null;

    const lines = transcript
        ? transcript.split('\n').filter((line) => line.trim() !== '')
        : [];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 bottom-0 w-full max-w-lg z-50 flex flex-col bg-[#0c0e14] border-l border-white/5"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                            <div>
                                <h2 className="text-lg font-bold text-white">Call Transcript</h2>
                                {callDetails?.customerName && (
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {callDetails.customerName} • {callDetails.phone}
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Call Meta */}
                        {callDetails && (
                            <div className="px-6 py-3 border-b border-white/5 flex items-center gap-4">
                                {callDetails.duration !== undefined && (
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span>{Math.floor(callDetails.duration / 60)}m {callDetails.duration % 60}s</span>
                                    </div>
                                )}
                                {callDetails.status && (
                                    <div className={`flex items-center gap-1.5 text-xs font-medium ${callDetails.status === 'completed' ? 'text-emerald-400' :
                                            callDetails.status === 'failed' ? 'text-red-400' :
                                                'text-amber-400'
                                        }`}>
                                        <Phone className="w-3.5 h-3.5" />
                                        <span className="capitalize">{callDetails.status}</span>
                                    </div>
                                )}
                                {callDetails.date && (
                                    <span className="text-[11px] text-muted-foreground ml-auto">{callDetails.date}</span>
                                )}
                            </div>
                        )}

                        {/* Transcript Body */}
                        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                            {lines.length > 0 ? (
                                lines.map((line, i) => {
                                    const isAssistant = line.startsWith('Assistant:');
                                    const isCaller = line.startsWith('Caller:');
                                    const content = line.replace(/^(Assistant|Caller):\s*/, '');

                                    return (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.03 }}
                                            className={`flex gap-3 ${isAssistant ? 'justify-start' : 'justify-end'}`}
                                        >
                                            {isAssistant && (
                                                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500/30 to-violet-500/30 border border-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                                                    <Bot className="w-3.5 h-3.5 text-indigo-400" />
                                                </div>
                                            )}
                                            <div
                                                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${isAssistant
                                                        ? 'bg-white/5 border border-white/5 text-white/90'
                                                        : isCaller
                                                            ? 'bg-indigo-500/15 border border-indigo-500/20 text-indigo-100'
                                                            : 'bg-white/5 border border-white/5 text-white/70'
                                                    }`}
                                            >
                                                {content}
                                            </div>
                                            {isCaller && (
                                                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-emerald-500/30 to-teal-500/30 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                                                    <User className="w-3.5 h-3.5 text-emerald-400" />
                                                </div>
                                            )}
                                        </motion.div>
                                    );
                                })
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-center">
                                    <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center mb-4">
                                        <Phone className="w-7 h-7 text-muted-foreground" />
                                    </div>
                                    <p className="text-sm text-muted-foreground">No transcript available</p>
                                    <p className="text-xs text-muted-foreground/60 mt-1">
                                        Transcripts are generated after AI calls complete
                                    </p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
