/**
 * apiClient.ts
 *
 * Centralized HTTP client for all backend API communication.
 *
 * ERROR CATEGORIZATION:
 *  - NETWORK: Fetch itself threw — no connection / DNS / CORS / timeout
 *  - SERVER:  Fetch succeeded but backend returned 5xx
 *  - CLIENT:  Fetch succeeded but backend returned 4xx (bad input, auth, etc.)
 */

// Fallback to local machine IP.
// Capacitor running on physical Android requires the LAN IP of the backend host machine.
// Change this to your backend server's IP address when switching networks.
export const API_BASE_URL = 'http://172.20.165.182:3000/api/v1';

export type ApiErrorType = 'NETWORK' | 'SERVER' | 'CLIENT' | 'UNKNOWN';

export class ApiError extends Error {
    constructor(
        public readonly type: ApiErrorType,
        message: string,
        public readonly status?: number
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

export interface ApiResponse<T = any> {
    status: number;
    ok: boolean;
    data: T;
}

export const apiClient = async <T = any>(
    endpoint: string,
    options: RequestInit = {}
): Promise<ApiResponse<T>> => {
    let response: Response;

    try {
        response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });
    } catch (networkError: any) {
        // This means fetch itself failed — no connection, CORS blocked, timeout, etc.
        const message = networkError?.message || 'Network unavailable';
        console.error(`[API] NETWORK error on ${endpoint}:`, networkError);
        throw new ApiError(
            'NETWORK',
            `Cannot reach the server. Make sure your device and the backend server are on the same Wi-Fi network. (${message})`
        );
    }

    let data: T;
    try {
        data = await response.json();
    } catch {
        // Backend returned a non-JSON body (HTML error page, etc.)
        data = {} as T;
    }

    if (response.status >= 500) {
        console.error(`[API] SERVER error on ${endpoint}: ${response.status}`, data);
        throw new ApiError('SERVER', `Server error (${response.status}). Please try again later.`, response.status);
    }

    if (response.status >= 400) {
        // 4xx: return as-is so the caller can inspect the data (e.g. validation errors)
        console.warn(`[API] CLIENT error on ${endpoint}: ${response.status}`, data);
    }

    return { status: response.status, ok: response.ok, data };
};
