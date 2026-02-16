'use client';

import React from 'react';
import Button from '@/components/Button';

export default function SettingsPage() {
    return (
        <div className="space-y-6">
            {/* Page header */}
            <div>
                <h1 className="text-2xl font-bold text-foreground">Settings</h1>
                <p className="text-sm text-muted mt-1">Configure your booking automation preferences</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Business Info */}
                <div className="rounded-xl border border-border bg-card/50 p-6 backdrop-blur-sm space-y-4">
                    <h2 className="text-lg font-semibold text-foreground">Business Information</h2>
                    <div>
                        <label className="block text-sm font-medium text-muted mb-1.5">Business Name</label>
                        <input
                            type="text"
                            defaultValue="VoiceFlow Dental Clinic"
                            className="w-full px-3 py-2 bg-background rounded-lg border border-border text-sm text-foreground outline-none focus:border-primary"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-muted mb-1.5">Business Phone</label>
                        <input
                            type="text"
                            defaultValue="+1 (555) 000-1234"
                            className="w-full px-3 py-2 bg-background rounded-lg border border-border text-sm text-foreground outline-none focus:border-primary"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-muted mb-1.5">Business Email</label>
                        <input
                            type="email"
                            defaultValue="admin@voiceflow-dental.com"
                            className="w-full px-3 py-2 bg-background rounded-lg border border-border text-sm text-foreground outline-none focus:border-primary"
                        />
                    </div>
                    <Button>Save Changes</Button>
                </div>

                {/* Notification Preferences */}
                <div className="rounded-xl border border-border bg-card/50 p-6 backdrop-blur-sm space-y-4">
                    <h2 className="text-lg font-semibold text-foreground">Notification Preferences</h2>
                    <div className="space-y-3">
                        {[
                            { label: 'Email notifications for new bookings', defaultChecked: true },
                            { label: 'SMS alerts for failed calls', defaultChecked: true },
                            { label: 'Daily campaign summary report', defaultChecked: false },
                            { label: 'Weekly analytics digest', defaultChecked: true },
                            { label: 'Real-time call status updates', defaultChecked: false },
                        ].map((pref) => (
                            <label key={pref.label} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-card-hover cursor-pointer">
                                <span className="text-sm text-foreground">{pref.label}</span>
                                <div className="relative">
                                    <input type="checkbox" defaultChecked={pref.defaultChecked} className="sr-only peer" />
                                    <div className="w-10 h-5 bg-border rounded-full peer-checked:bg-primary transition-colors" />
                                    <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform" />
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                {/* API Configuration */}
                <div className="rounded-xl border border-border bg-card/50 p-6 backdrop-blur-sm space-y-4">
                    <h2 className="text-lg font-semibold text-foreground">API Configuration</h2>
                    <div>
                        <label className="block text-sm font-medium text-muted mb-1.5">API Key</label>
                        <div className="flex gap-2">
                            <input
                                type="password"
                                defaultValue="sk-voiceflow-xxxxxxxxxxxxxxxxxxxx"
                                className="flex-1 px-3 py-2 bg-background rounded-lg border border-border text-sm text-foreground outline-none focus:border-primary font-mono"
                            />
                            <Button variant="secondary" size="sm">Copy</Button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-muted mb-1.5">Webhook URL</label>
                        <input
                            type="url"
                            placeholder="https://your-app.com/webhook"
                            className="w-full px-3 py-2 bg-background rounded-lg border border-border text-sm text-foreground placeholder:text-muted outline-none focus:border-primary"
                        />
                    </div>
                    <Button>Update API Settings</Button>
                </div>

                {/* Voice Agent Settings */}
                <div className="rounded-xl border border-border bg-card/50 p-6 backdrop-blur-sm space-y-4">
                    <h2 className="text-lg font-semibold text-foreground">Voice Agent Settings</h2>
                    <div>
                        <label className="block text-sm font-medium text-muted mb-1.5">Voice Style</label>
                        <select className="w-full px-3 py-2 bg-background rounded-lg border border-border text-sm text-foreground outline-none focus:border-primary cursor-pointer">
                            <option>Professional Female</option>
                            <option>Professional Male</option>
                            <option>Friendly Female</option>
                            <option>Friendly Male</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-muted mb-1.5">Max Retry Attempts</label>
                        <input
                            type="number"
                            defaultValue={3}
                            min={1}
                            max={5}
                            className="w-full px-3 py-2 bg-background rounded-lg border border-border text-sm text-foreground outline-none focus:border-primary"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-muted mb-1.5">Call Timeout (seconds)</label>
                        <input
                            type="number"
                            defaultValue={30}
                            min={10}
                            max={120}
                            className="w-full px-3 py-2 bg-background rounded-lg border border-border text-sm text-foreground outline-none focus:border-primary"
                        />
                    </div>
                    <Button>Save Voice Settings</Button>
                </div>
            </div>
        </div>
    );
}
