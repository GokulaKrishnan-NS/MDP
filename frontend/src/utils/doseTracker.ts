/**
 * doseTracker.ts
 *
 * Tracks which doses have been taken today using localStorage.
 * Keys are LOCAL date-scoped — NOT UTC — so they reset at midnight
 * in the user's local timezone (critical for IST, PST, etc).
 *
 * Key format: dose_taken__{trayId}__{doseTime}__{YYYY-MM-DD}
 */

const PREFIX = 'dose_taken__';

/** Returns local date as "YYYY-MM-DD". NOT UTC — avoids midnight rollover bugs for non-UTC timezones. */
function localDateStr(d: Date = new Date()): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function todayKey(trayId: number, doseTime: string): string {
    return `${PREFIX}${trayId}__${doseTime}__${localDateStr()}`;
}

/** Mark a specific dose slot as taken for today (local date). */
export function markDoseTaken(trayId: number, doseTime: string): void {
    localStorage.setItem(todayKey(trayId, doseTime), '1');
}

/** Returns true if this dose slot has already been taken today (local date). */
export function isDoseTaken(trayId: number, doseTime: string): boolean {
    return localStorage.getItem(todayKey(trayId, doseTime)) === '1';
}

/**
 * Remove dose keys older than 2 days (local) to keep localStorage clean.
 * Call this on app startup.
 */
export function clearExpiredDoseKeys(): void {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 2);
    const cutoffStr = localDateStr(cutoff);

    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key?.startsWith(PREFIX)) continue;
        const datePart = key.split('__').at(-1) ?? '';
        if (datePart < cutoffStr) toRemove.push(key);
    }
    toRemove.forEach(k => localStorage.removeItem(k));
}

/**
 * Get all dose times for a tray that are already taken today (local date).
 */
export function getTakenDosesForTray(trayId: number): Set<string> {
    const today = localDateStr();
    const taken = new Set<string>();
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key?.startsWith(`${PREFIX}${trayId}__`)) continue;
        if (!key.endsWith(`__${today}`)) continue;
        const parts = key.replace(PREFIX, '').split('__');
        if (parts.length === 3) taken.add(parts[1]);
    }
    return taken;
}
