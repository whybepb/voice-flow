'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

interface User {
    id: string;
    email: string;
    name: string | null;
    company: string | null;
    role: string;
    onboardingComplete: boolean;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    googleLogin: (credential: string) => Promise<void>;
    logout: () => void;
    completeOnboarding: (data: OnboardingData) => Promise<void>;
    refreshUser: () => Promise<void>;
}

interface OnboardingData {
    company: string;
    twilioAccountSid: string;
    twilioAuthToken: string;
    twilioPhoneNumber: string;
    openaiApiKey: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    const publicPaths = ['/', '/login', '/signup'];

    const fetchUser = useCallback(async (authToken: string) => {
        try {
            const res = await fetch(`${API_URL}/auth/me`, {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            if (!res.ok) throw new Error('Invalid token');
            const data = await res.json();
            setUser(data.data);
            return data.data as User;
        } catch {
            localStorage.removeItem('voiceflow_token');
            setToken(null);
            setUser(null);
            return null;
        }
    }, []);

    // Check for existing token on mount
    useEffect(() => {
        const init = async () => {
            const savedToken = localStorage.getItem('voiceflow_token');
            if (savedToken) {
                setToken(savedToken);
                const userData = await fetchUser(savedToken);
                if (userData && !publicPaths.includes(pathname)) {
                    if (!userData.onboardingComplete && pathname !== '/onboarding') {
                        router.replace('/onboarding');
                    }
                }
            }
            setIsLoading(false);
        };
        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const login = async (email: string, password: string) => {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || 'Login failed');
        }

        const authToken = data.data.token;
        localStorage.setItem('voiceflow_token', authToken);
        setToken(authToken);

        // Fetch full user profile
        const userData = await fetchUser(authToken);

        if (userData && !userData.onboardingComplete) {
            router.push('/onboarding');
        } else {
            router.push('/');
        }
    };

    const register = async (name: string, email: string, password: string) => {
        const res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password }),
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || 'Registration failed');
        }

        const authToken = data.data.token;
        localStorage.setItem('voiceflow_token', authToken);
        setToken(authToken);
        await fetchUser(authToken);
        router.push('/onboarding');
    };

    const logout = () => {
        localStorage.removeItem('voiceflow_token');
        setToken(null);
        setUser(null);
        router.push('/landing');
    };

    const googleLogin = async (credential: string) => {
        const res = await fetch(`${API_URL}/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ credential }),
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || 'Google sign-in failed');
        }

        const authToken = data.data.token;
        localStorage.setItem('voiceflow_token', authToken);
        setToken(authToken);

        const userData = await fetchUser(authToken);

        if (userData && !userData.onboardingComplete) {
            router.push('/onboarding');
        } else {
            router.push('/');
        }
    };

    const completeOnboarding = async (data: OnboardingData) => {
        const res = await fetch(`${API_URL}/auth/onboarding`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        });

        const result = await res.json();

        if (!res.ok) {
            throw new Error(result.message || 'Onboarding failed');
        }

        setUser(result.data);
        router.push('/');
    };

    const refreshUser = async () => {
        if (token) {
            await fetchUser(token);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isLoading,
                isAuthenticated: !!user && !!token,
                login,
                register,
                googleLogin,
                logout,
                completeOnboarding,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
