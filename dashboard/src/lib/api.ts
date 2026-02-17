const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
    const res = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'API Error');
    }

    return res.json();
}

export const api = {
    get: (endpoint: string) => fetchAPI(endpoint, { method: 'GET' }),
    post: (endpoint: string, data: any) => fetchAPI(endpoint, { method: 'POST', body: JSON.stringify(data) }),
    patch: (endpoint: string, data: any) => fetchAPI(endpoint, { method: 'PATCH', body: JSON.stringify(data) }),
    del: (endpoint: string) => fetchAPI(endpoint, { method: 'DELETE' }),
};
