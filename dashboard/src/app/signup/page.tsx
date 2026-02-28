'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mic, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import GoogleAuthButton from '@/components/GoogleAuthButton';

export default function SignupPage() {
    const { register } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            await register(name, email, password);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center px-6 relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-b from-primary/15 via-violet-500/10 to-transparent rounded-full blur-[100px]" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-[80px]" />
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-[80px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative w-full max-w-md"
            >
                {/* Logo */}
                <div className="flex items-center justify-center gap-3 mb-8">
                    <Link href="/landing" className="flex items-center gap-3">
                        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-violet-500 shadow-lg shadow-primary/20">
                            <Mic className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-white tracking-tight">VoiceFlow</span>
                    </Link>
                </div>

                {/* Card */}
                <div className="rounded-2xl border border-white/5 bg-card/40 backdrop-blur-xl p-8 shadow-2xl shadow-black/40">
                    <div className="text-center mb-7">
                        <h1 className="text-2xl font-bold text-white">Create your account</h1>
                        <p className="text-sm text-muted-foreground mt-1.5">Get started with VoiceFlow in seconds</p>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                        >
                            {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <GoogleAuthButton label="Sign up with Google" />

                        <div className="flex items-center gap-3">
                            <div className="flex-1 h-px bg-white/10" />
                            <span className="text-xs text-muted-foreground font-medium">or</span>
                            <div className="flex-1 h-px bg-white/10" />
                        </div>
                        <div>
                            <label className="block text-[13px] font-semibold text-foreground/80 mb-2">Full Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="John Doe"
                                required
                                className="w-full px-4 py-3 bg-white/5 rounded-xl border border-white/5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50 focus:bg-white/10 transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-[13px] font-semibold text-foreground/80 mb-2">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                                className="w-full px-4 py-3 bg-white/5 rounded-xl border border-white/5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50 focus:bg-white/10 transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-[13px] font-semibold text-foreground/80 mb-2">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="w-full px-4 py-3 bg-white/5 rounded-xl border border-white/5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50 focus:bg-white/10 transition-all pr-12"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[13px] font-semibold text-foreground/80 mb-2">Confirm Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="w-full px-4 py-3 bg-white/5 rounded-xl border border-white/5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50 focus:bg-white/10 transition-all"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 text-sm font-semibold text-white bg-gradient-to-r from-primary to-violet-500 rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/25 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    Create Account
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Login link */}
                <p className="text-center mt-6 text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <Link href="/login" className="text-primary hover:text-primary/80 font-semibold transition-colors">
                        Sign in
                    </Link>
                </p>
            </motion.div>
        </div>
    );
}
