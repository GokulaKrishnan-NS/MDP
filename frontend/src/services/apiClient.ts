const API_BASE = import.meta.env.VITE_API_URL ?? '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message ?? `HTTP ${res.status}`);
    return json;
}

export const api = {
    health: () => request('/health'),
    getTrays: () => request('/trays'),
    addTray: (body: object) => request('/trays', { method: 'POST', body: JSON.stringify(body) }),
    initTrays: (body: object[]) => request('/trays/init', { method: 'POST', body: JSON.stringify(body) }),
    deleteTray: (id: number) => request(`/trays/${id}`, { method: 'DELETE' }),
    dispense: async (medicineName: string, mode: string) => {
        console.log(`[Frontend] Requesting dispense via backend: ${medicineName}, mode: ${mode}`);
        const backendRes = await request('/dispense', {
            method: 'POST',
            body: JSON.stringify({ medicineName, mode })
        });
        return backendRes;
    },
    getDeviceStatus: () => request('/device/status'),
};

