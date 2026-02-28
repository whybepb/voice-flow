'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mic, PhoneCall, BarChart3, Zap, Shield, Clock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.1, duration: 0.6, ease: 'easeOut' as const },
    }),
};

const features = [
    {
        icon: PhoneCall,
        title: 'AI Voice Calls',
        description: 'Automate outbound calls with natural-sounding AI agents that confirm, remind, and reschedule bookings.',
        color: 'from-indigo-500 to-violet-500',
    },
    {
        icon: Zap,
        title: 'Campaign Manager',
        description: 'Create and launch bulk calling campaigns. Schedule, track, and optimize in real-time.',
        color: 'from-amber-500 to-orange-500',
    },
    {
        icon: BarChart3,
        title: 'Live Analytics',
        description: 'Monitor call success rates, confirmation trends, and customer engagement with beautiful dashboards.',
        color: 'from-emerald-500 to-teal-500',
    },
    {
        icon: Shield,
        title: 'Secure & Reliable',
        description: 'Your API keys and credentials are encrypted. Built on enterprise-grade Twilio and OpenAI infrastructure.',
        color: 'from-rose-500 to-pink-500',
    },
    {
        icon: Clock,
        title: 'Save Hours Daily',
        description: 'Eliminate manual follow-ups. Let AI handle confirmations while you focus on what matters.',
        color: 'from-cyan-500 to-blue-500',
    },
    {
        icon: Mic,
        title: 'Natural Conversations',
        description: 'Powered by OpenAI Realtime API — your voice agent sounds human, not robotic.',
        color: 'from-purple-500 to-fuchsia-500',
    },
];

const steps = [
    { step: '01', title: 'Create Your Account', desc: 'Sign up in seconds and set up your profile.' },
    { step: '02', title: 'Connect Your Services', desc: 'Enter your Twilio and OpenAI credentials in our secure onboarding.' },
    { step: '03', title: 'Launch Campaigns', desc: 'Start automated voice calls and watch confirmations roll in.' },
];

export default function LandingPage() {
    const { isAuthenticated, isLoading, user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && isAuthenticated && user?.onboardingComplete) {
            router.replace('/');
        }
    }, [isAuthenticated, isLoading, user, router]);

    return (
        <div className="min-h-screen bg-background overflow-hidden">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/70 border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-violet-500 shadow-lg shadow-primary/20">
                            <Mic className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-lg font-bold text-white tracking-tight">VoiceFlow</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href="/login"
                            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-white transition-colors"
                        >
                            Log in
                        </Link>
                        <Link
                            href="/signup"
                            className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-primary to-violet-500 rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            Get Started
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 px-6">
                {/* Background effects */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-primary/20 via-violet-500/10 to-transparent rounded-full blur-[120px]" />
                    <div className="absolute top-40 left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-[100px]" />
                    <div className="absolute top-60 right-20 w-72 h-72 bg-purple-500/10 rounded-full blur-[100px]" />
                </div>

                <div className="relative max-w-5xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8"
                    >
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        Powered by OpenAI Realtime API + Twilio
                    </motion.div>

                    <motion.h1
                        custom={1}
                        variants={fadeUp}
                        initial="hidden"
                        animate="visible"
                        className="text-5xl md:text-7xl font-extrabold text-white leading-[1.1] tracking-tight"
                    >
                        Automate Your
                        <br />
                        <span className="bg-gradient-to-r from-primary via-violet-400 to-purple-400 bg-clip-text text-transparent">
                            Voice Bookings
                        </span>
                    </motion.h1>

                    <motion.p
                        custom={2}
                        variants={fadeUp}
                        initial="hidden"
                        animate="visible"
                        className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
                    >
                        Deploy AI-powered voice agents that confirm appointments, remind customers,
                        and handle rescheduling — all without lifting a finger.
                    </motion.p>

                    <motion.div
                        custom={3}
                        variants={fadeUp}
                        initial="hidden"
                        animate="visible"
                        className="mt-10 flex items-center justify-center gap-4 flex-wrap"
                    >
                        <Link
                            href="/signup"
                            className="group inline-flex items-center gap-2 px-7 py-3.5 text-sm font-semibold text-white bg-gradient-to-r from-primary to-violet-500 rounded-xl shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            Start For Free
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                        <Link
                            href="/login"
                            className="inline-flex items-center gap-2 px-7 py-3.5 text-sm font-semibold text-white bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
                        >
                            Sign In
                        </Link>
                    </motion.div>

                    {/* Trust badges */}
                    <motion.div
                        custom={4}
                        variants={fadeUp}
                        initial="hidden"
                        animate="visible"
                        className="mt-12 flex items-center justify-center gap-6 text-sm text-muted-foreground"
                    >
                        {['No credit card required', 'Free setup', '24/7 AI calling'].map((text) => (
                            <span key={text} className="flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                {text}
                            </span>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Features Section */}
            <section className="relative py-24 px-6">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-3xl md:text-4xl font-extrabold text-white">
                            Everything you need to
                            <span className="bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent"> automate calls</span>
                        </h2>
                        <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto">
                            From AI voice agents to campaign management — VoiceFlow gives you the complete toolkit.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {features.map((feature, i) => (
                            <motion.div
                                key={feature.title}
                                custom={i}
                                variants={fadeUp}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true }}
                                className="group relative rounded-2xl border border-white/5 bg-white/[0.02] p-7 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300"
                            >
                                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.color} shadow-lg mb-5`}>
                                    <feature.icon className="w-5 h-5 text-white" />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="relative py-24 px-6">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
                <div className="relative max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-3xl md:text-4xl font-extrabold text-white">
                            Get started in <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">3 steps</span>
                        </h2>
                    </motion.div>

                    <div className="space-y-6">
                        {steps.map((s, i) => (
                            <motion.div
                                key={s.step}
                                custom={i}
                                variants={fadeUp}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true }}
                                className="flex items-start gap-6 p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                            >
                                <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-violet-500/20 flex items-center justify-center border border-primary/20">
                                    <span className="text-xl font-extrabold bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">{s.step}</span>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">{s.title}</h3>
                                    <p className="mt-1 text-muted-foreground">{s.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="relative py-24 px-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="max-w-4xl mx-auto text-center rounded-3xl bg-gradient-to-br from-primary/10 via-violet-500/10 to-purple-500/10 border border-primary/20 p-12 md:p-16"
                >
                    <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
                        Ready to automate your calls?
                    </h2>
                    <p className="text-muted-foreground text-lg mb-8 max-w-lg mx-auto">
                        Join VoiceFlow and let AI handle your booking confirmations. Set up in under 5 minutes.
                    </p>
                    <Link
                        href="/signup"
                        className="group inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-primary to-violet-500 rounded-xl shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        Get Started — It&apos;s Free
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                </motion.div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/5 py-10 px-6">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-violet-500 flex items-center justify-center">
                            <Mic className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span className="font-bold text-white">VoiceFlow</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        © {new Date().getFullYear()} VoiceFlow. AI-powered booking automation.
                    </p>
                </div>
            </footer>
        </div>
    );
}
