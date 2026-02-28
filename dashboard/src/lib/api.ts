const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
    // Get token from localStorage (client side only)
    let token: string | null = null;
    if (typeof window !== 'undefined') {
        token = localStorage.getItem('voiceflow_token');
    }

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'API Error');
    }

    return res.json();
}

export const api = {
    get: (endpoint: string) => fetchAPI(endpoint, { method: 'GET' }),
    post: (endpoint: string, data: unknown) => fetchAPI(endpoint, { method: 'POST', body: JSON.stringify(data) }),
    patch: (endpoint: string, data: unknown) => fetchAPI(endpoint, { method: 'PATCH', body: JSON.stringify(data) }),
    del: (endpoint: string) => fetchAPI(endpoint, { method: 'DELETE' }),
};
