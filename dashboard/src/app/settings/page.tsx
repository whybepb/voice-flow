'use client';

import React from 'react';
import Button from '@/components/Button';
import { FadeIn, StaggerContainer } from '@/components/ui/Motion';
import { Building2, Bell, Shield, Mic, Save, Copy, Check } from 'lucide-react';

export default function SettingsPage() {
    return (
        <StaggerContainer className="space-y-8">
            {/* Page Header */}
            <FadeIn>
                <h1 className="text-3xl font-bold text-foreground tracking-tight">Settings</h1>
                <p className="text-sm text-muted-foreground mt-1.5">Configure your booking automation preferences</p>
            </FadeIn>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Business Info */}
                <FadeIn delay={0.1}>
                    <div className="rounded-2xl border border-white/5 bg-card/40 p-7 space-y-5 backdrop-blur-sm hover:border-white/10 transition-colors">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                <Building2 className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-[15px] font-bold text-foreground">Business Information</h2>
                                <p className="text-[12px] text-muted-foreground">Your business profile details</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[13px] font-semibold text-foreground/80 mb-2">Business Name</label>
                                <input
                                    type="text"
                                    defaultValue="VoiceFlow Dental Clinic"
                                    className="w-full px-4 py-3 bg-white/5 rounded-xl border border-white/5 text-sm text-foreground outline-none focus:border-primary/50 focus:bg-white/10 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[13px] font-semibold text-foreground/80 mb-2">Business Phone</label>
                                <input
                                    type="text"
                                    defaultValue="+1 (555) 000-1234"
                                    className="w-full px-4 py-3 bg-white/5 rounded-xl border border-white/5 text-sm text-foreground outline-none focus:border-primary/50 focus:bg-white/10 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[13px] font-semibold text-foreground/80 mb-2">Business Email</label>
                                <input
                                    type="email"
                                    defaultValue="admin@voiceflow-dental.com"
                                    className="w-full px-4 py-3 bg-white/5 rounded-xl border border-white/5 text-sm text-foreground outline-none focus:border-primary/50 focus:bg-white/10 transition-all"
                                />
                            </div>
                        </div>
                        <div className="pt-2">
                            <Button>
                                <Save className="w-4 h-4 mr-2" />
                                Save Changes
                            </Button>
                        </div>
                    </div>
                </FadeIn>

                {/* Notification Preferences */}
                <FadeIn delay={0.2}>
                    <div className="rounded-2xl border border-white/5 bg-card/40 p-7 space-y-5 backdrop-blur-sm hover:border-white/10 transition-colors">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                                <Bell className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-[15px] font-bold text-foreground">Notifications</h2>
                                <p className="text-[12px] text-muted-foreground">Choose what notifications you receive</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            {[
                                { label: 'Email notifications for new bookings', on: true },
                                { label: 'SMS alerts for failed calls', on: true },
                                { label: 'Daily campaign summary report', on: false },
                                { label: 'Weekly analytics digest', on: true },
                                { label: 'Real-time call status updates', on: false },
                            ].map((pref) => (
                                <label key={pref.label} className="flex items-center justify-between p-3.5 rounded-xl border border-white/5 hover:bg-white/5 cursor-pointer transition-colors group">
                                    <span className="text-[13px] text-foreground/90 group-hover:text-foreground transition-colors">{pref.label}</span>
                                    <div className="relative flex-shrink-0">
                                        <input type="checkbox" defaultChecked={pref.on} className="sr-only peer" />
                                        <div className="w-10 h-[22px] bg-white/10 rounded-full peer-checked:bg-primary transition-colors" />
                                        <div className="absolute top-[3px] left-[3px] w-4 h-4 bg-white rounded-full shadow-sm peer-checked:translate-x-[18px] transition-transform" />
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                </FadeIn>

                {/* API Configuration */}
                <FadeIn delay={0.3}>
                    <div className="rounded-2xl border border-white/5 bg-card/40 p-7 space-y-5 backdrop-blur-sm hover:border-white/10 transition-colors">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                                <Shield className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-[15px] font-bold text-foreground">API Configuration</h2>
                                <p className="text-[12px] text-muted-foreground">Manage API keys and webhooks</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[13px] font-semibold text-foreground/80 mb-2">API Key</label>
                                <div className="flex gap-2">
                                    <input
                                        type="password"
                                        defaultValue="sk-voiceflow-xxxxxxxxxxxxxxxxxxxx"
                                        className="flex-1 px-4 py-3 bg-white/5 rounded-xl border border-white/5 text-sm text-foreground outline-none focus:border-primary/50 font-mono transition-all"
                                    />
                                    <Button variant="secondary" size="sm">
                                        <Copy className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[13px] font-semibold text-foreground/80 mb-2">Webhook URL</label>
                                <input
                                    type="url"
                                    placeholder="https://your-app.com/webhook"
                                    className="w-full px-4 py-3 bg-white/5 rounded-xl border border-white/5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50 transition-all"
                                />
                            </div>
                        </div>
                        <div className="pt-2">
                            <Button>Update API Settings</Button>
                        </div>
                    </div>
                </FadeIn>

                {/* Voice Agent Settings */}
                <FadeIn delay={0.4}>
                    <div className="rounded-2xl border border-white/5 bg-card/40 p-7 space-y-5 backdrop-blur-sm hover:border-white/10 transition-colors">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-lg bg-violet-500/10 text-violet-500">
                                <Mic className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-[15px] font-bold text-foreground">Voice Agent</h2>
                                <p className="text-[12px] text-muted-foreground">Configure AI voice call settings</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[13px] font-semibold text-foreground/80 mb-2">Voice Style</label>
                                <div className="relative">
                                    <select className="w-full px-4 py-3 bg-white/5 rounded-xl border border-white/5 text-sm text-foreground outline-none focus:border-primary/50 cursor-pointer transition-all appearance-none">
                                        <option>Professional Female</option>
                                        <option>Professional Male</option>
                                        <option>Friendly Female</option>
                                        <option>Friendly Male</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[13px] font-semibold text-foreground/80 mb-2">Max Retry Attempts</label>
                                <input
                                    type="number"
                                    defaultValue={3}
                                    min={1}
                                    max={5}
                                    className="w-full px-4 py-3 bg-white/5 rounded-xl border border-white/5 text-sm text-foreground outline-none focus:border-primary/50 transition-all"
                                />
                            </div>
                        </div>
                        <div className="pt-2">
                            <Button>Save Voice Settings</Button>
                        </div>
                    </div>
                </FadeIn>
            </div>
        </StaggerContainer>
    );
}
