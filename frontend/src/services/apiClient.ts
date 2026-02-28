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
    dispense: (medicineName: string, mode: string) =>
        request('/dispense', { method: 'POST', body: JSON.stringify({ medicineName, mode }) }),
    getDeviceStatus: () => request('/device/status'),
};

