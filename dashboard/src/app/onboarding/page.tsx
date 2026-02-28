'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Building2, Phone, Key, ArrowRight, ArrowLeft, Loader2, CheckCircle2, Shield } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const steps = [
    { id: 1, title: 'Business Info', icon: Building2, desc: 'Tell us about your business' },
    { id: 2, title: 'Twilio Setup', icon: Phone, desc: 'Connect your Twilio account' },
    { id: 3, title: 'OpenAI Key', icon: Key, desc: 'Add your OpenAI API key' },
];

export default function OnboardingPage() {
    const { user, isAuthenticated, isLoading: authLoading, completeOnboarding } = useAuth();
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        company: '',
        twilioAccountSid: '',
        twilioAuthToken: '',
        twilioPhoneNumber: '',
        openaiApiKey: '',
    });

    useEffect(() => {
        if (!authLoading) {
            if (!isAuthenticated) {
                router.replace('/login');
            } else if (user?.onboardingComplete) {
                router.replace('/');
            }
        }
    }, [authLoading, isAuthenticated, user, router]);

    const updateField = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const nextStep = () => {
        if (currentStep === 1) {
            if (!formData.company.trim()) {
                setError('Please enter your company name');
                return;
            }
        } else if (currentStep === 2) {
            if (!formData.twilioAccountSid || !formData.twilioAuthToken || !formData.twilioPhoneNumber) {
                setError('Please fill in all Twilio credentials');
                return;
            }
        }
        setError('');
        setCurrentStep(prev => Math.min(prev + 1, 3));
    };

    const prevStep = () => {
        setError('');
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    const handleSubmit = async () => {
        if (!formData.openaiApiKey.trim()) {
            setError('Please enter your OpenAI API key');
            return;
        }

        setError('');
        setLoading(true);

        try {
            await completeOnboarding(formData);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to save. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || !isAuthenticated) {
        return (
            <div className="flex items-center justify-center h-screen bg-background">
                <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center px-6 relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-b from-primary/15 via-violet-500/10 to-transparent rounded-full blur-[100px]" />
                <div className="absolute bottom-20 left-20 w-72 h-72 bg-emerald-500/5 rounded-full blur-[80px]" />
                <div className="absolute top-40 right-10 w-72 h-72 bg-purple-500/5 rounded-full blur-[80px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative w-full max-w-lg"
            >
                {/* Logo */}
                <div className="flex items-center justify-center gap-3 mb-6">
                    <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-violet-500 shadow-lg shadow-primary/20">
                        <Mic className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-bold text-white tracking-tight">VoiceFlow</span>
                </div>

                {/* Welcome text */}
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-white">
                        Welcome{user?.name ? `, ${user.name}` : ''}! 👋
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1.5">Let&apos;s set up your voice agent in 3 easy steps</p>
                </div>

                {/* Step Progress */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    {steps.map((step, i) => (
                        <React.Fragment key={step.id}>
                            <div className="flex items-center gap-2">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-300 ${currentStep > step.id
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                                    : currentStep === step.id
                                        ? 'bg-primary/20 text-primary border border-primary/30'
                                        : 'bg-white/5 text-muted-foreground border border-white/5'
                                    }`}>
                                    {currentStep > step.id ? (
                                        <CheckCircle2 className="w-4 h-4" />
                                    ) : (
                                        step.id
                                    )}
                                </div>
                                <span className={`text-xs font-medium hidden sm:block ${currentStep >= step.id ? 'text-white' : 'text-muted-foreground'
                                    }`}>
                                    {step.title}
                                </span>
                            </div>
                            {i < steps.length - 1 && (
                                <div className={`w-8 h-px transition-colors ${currentStep > step.id ? 'bg-emerald-500/50' : 'bg-white/10'
                                    }`} />
                            )}
                        </React.Fragment>
                    ))}
                </div>

                {/* Card */}
                <div className="rounded-2xl border border-white/5 bg-card/40 backdrop-blur-xl p-8 shadow-2xl shadow-black/40">
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                        >
                            {error}
                        </motion.div>
                    )}

                    <AnimatePresence mode="wait">
                        {currentStep === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-5"
                            >
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                                        <Building2 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-white">Business Information</h2>
                                        <p className="text-xs text-muted-foreground">What&apos;s your business called?</p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[13px] font-semibold text-foreground/80 mb-2">Company Name</label>
                                    <input
                                        type="text"
                                        value={formData.company}
                                        onChange={(e) => updateField('company', e.target.value)}
                                        placeholder="e.g., Sunrise Dental Clinic"
                                        className="w-full px-4 py-3 bg-white/5 rounded-xl border border-white/5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50 focus:bg-white/10 transition-all"
                                    />
                                </div>
                            </motion.div>
                        )}

                        {currentStep === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-5"
                            >
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
                                        <Phone className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-white">Twilio Credentials</h2>
                                        <p className="text-xs text-muted-foreground">Connect your Twilio account for voice calls</p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[13px] font-semibold text-foreground/80 mb-2">Account SID</label>
                                    <input
                                        type="text"
                                        value={formData.twilioAccountSid}
                                        onChange={(e) => updateField('twilioAccountSid', e.target.value)}
                                        placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                        className="w-full px-4 py-3 bg-white/5 rounded-xl border border-white/5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50 focus:bg-white/10 transition-all font-mono"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[13px] font-semibold text-foreground/80 mb-2">Auth Token</label>
                                    <input
                                        type="password"
                                        value={formData.twilioAuthToken}
                                        onChange={(e) => updateField('twilioAuthToken', e.target.value)}
                                        placeholder="••••••••••••••••••••••••••••••"
                                        className="w-full px-4 py-3 bg-white/5 rounded-xl border border-white/5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50 focus:bg-white/10 transition-all font-mono"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[13px] font-semibold text-foreground/80 mb-2">Phone Number</label>
                                    <input
                                        type="text"
                                        value={formData.twilioPhoneNumber}
                                        onChange={(e) => updateField('twilioPhoneNumber', e.target.value)}
                                        placeholder="+1234567890"
                                        className="w-full px-4 py-3 bg-white/5 rounded-xl border border-white/5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50 focus:bg-white/10 transition-all font-mono"
                                    />
                                </div>

                                <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                                    <Shield className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                                    <p className="text-xs text-amber-400/80">Your credentials are securely stored and encrypted. Find them in your Twilio Console.</p>
                                </div>
                            </motion.div>
                        )}

                        {currentStep === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-5"
                            >
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
                                        <Key className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-white">OpenAI API Key</h2>
                                        <p className="text-xs text-muted-foreground">Power your voice agent with AI intelligence</p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[13px] font-semibold text-foreground/80 mb-2">API Key</label>
                                    <input
                                        type="password"
                                        value={formData.openaiApiKey}
                                        onChange={(e) => updateField('openaiApiKey', e.target.value)}
                                        placeholder="sk-proj-xxxxxxxxxxxxxxxxxxxxxxxx"
                                        className="w-full px-4 py-3 bg-white/5 rounded-xl border border-white/5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50 focus:bg-white/10 transition-all font-mono"
                                    />
                                </div>

                                <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                                    <Shield className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                                    <p className="text-xs text-emerald-400/80">Get your API key from the OpenAI platform dashboard. Your key is securely stored.</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between mt-8">
                        <button
                            onClick={prevStep}
                            disabled={currentStep === 1}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </button>

                        {currentStep < 3 ? (
                            <button
                                onClick={nextStep}
                                className="flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-primary to-violet-500 rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/25 transition-all hover:scale-[1.01] active:scale-[0.99]"
                            >
                                Continue
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        Complete Setup
                                        <CheckCircle2 className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
