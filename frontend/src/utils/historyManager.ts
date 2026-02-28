import type { DispenseHistory } from '../types/DispenseHistory';
import type { Tray } from '../types';

const HISTORY_KEY = 'dispenseHistory';

export function logDispenseEvent(
    tray: Pick<Tray, 'trayId' | 'medicineName' | 'pillsPerDose'>,
    quantity: number,
    status: DispenseHistory['status'],
): void {
    const history = getDispenseHistory();
    const entry: DispenseHistory = {
        id: crypto.randomUUID(),
        trayId: tray.trayId,
        medicineName: tray.medicineName,
        quantity,
        timestamp: new Date().toISOString(),
        status,
    };
    history.unshift(entry); // newest first
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    // Notify other components (via storage event only fires cross-tab; dispatch manually for same-tab)
    window.dispatchEvent(new Event('dispenseHistoryUpdated'));
}

export function getDispenseHistory(): DispenseHistory[] {
    try {
        return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]') as DispenseHistory[];
    } catch {
        return [];
    }
}

export function clearDispenseHistory(): void {
    localStorage.removeItem(HISTORY_KEY);
    window.dispatchEvent(new Event('dispenseHistoryUpdated'));
}
