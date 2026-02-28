export interface DispenseHistory {
    id: string;
    trayId: number;
    medicineName: string;
    quantity: number;
    timestamp: string; // ISO string
    status: 'success' | 'blocked-early' | 'blocked-late';
}
