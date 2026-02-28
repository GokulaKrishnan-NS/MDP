/**
 * notificationService.ts
 *
 * Schedules dose-reminder local notifications via @capacitor/local-notifications.
 * Falls back to Web Notification API in the browser.
 *
 * Notification IDs are persisted per-tray in localStorage so individual trays
 * can be cancelled without affecting others.
 */

import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

// ── Per-tray notification ID tracking ────────────────────────────────────────
const NOTIF_KEY_PREFIX = 'notif_ids__';

function getStoredIds(trayId: number): number[] {
    try {
        return JSON.parse(localStorage.getItem(`${NOTIF_KEY_PREFIX}${trayId}`) ?? '[]');
    } catch { return []; }
}

function storeIds(trayId: number, ids: number[]): void {
    try {
        const existing = getStoredIds(trayId);
        localStorage.setItem(`${NOTIF_KEY_PREFIX}${trayId}`, JSON.stringify([...existing, ...ids]));
    } catch { /* ignore storage errors */ }
}

function clearStoredIds(trayId: number): void {
    localStorage.removeItem(`${NOTIF_KEY_PREFIX}${trayId}`);
}

// Monotonically increasing ID counter — persisted so IDs stay unique across sessions
let _notifId = parseInt(localStorage.getItem('notif_counter') ?? '1000', 10);
function nextId(): number {
    const id = _notifId++;
    localStorage.setItem('notif_counter', String(_notifId));
    return id;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Schedule two notifications for a single dose slot:
 *   - 10 min before  → "💊 Dose in 10 minutes"
 *   - Exact time     → "🚨 Dose Time!"
 */
export async function scheduleAlarmNotification(
    trayId: number,
    medicineName: string,
    scheduledTime: string,
): Promise<void> {
    const [hStr, mStr] = scheduledTime.split(':');
    const now = new Date();

    const doseTime = new Date(now);
    doseTime.setHours(Number(hStr), Number(mStr), 0, 0);
    // If dose time is already past for today, push to tomorrow
    if (doseTime.getTime() <= now.getTime()) {
        doseTime.setDate(doseTime.getDate() + 1);
    }

    const warningTime = new Date(doseTime.getTime() - 10 * 60 * 1000);

    // ── Capacitor native path ─────────────────────────────────────────────────
    if (Capacitor.isNativePlatform()) {
        try {
            const notifications: any[] = [];
            const scheduledIds: number[] = [];

            if (warningTime.getTime() > Date.now()) {
                const id = nextId();
                scheduledIds.push(id);
                notifications.push({
                    id,
                    title: '💊 Dose in 10 minutes',
                    body: `Prepare ${medicineName} — dose at ${scheduledTime}`,
                    schedule: { at: warningTime },
                    sound: 'default',
                    extra: { trayId, type: 'warning', slot: scheduledTime },
                });
            }

            const exactId = nextId();
            scheduledIds.push(exactId);
            notifications.push({
                id: exactId,
                title: '🚨 Dose Time!',
                body: `Time to take ${medicineName} (${scheduledTime})`,
                schedule: { at: doseTime },
                sound: 'default',
                extra: { trayId, type: 'alarm', slot: scheduledTime },
            });

            await LocalNotifications.schedule({ notifications });
            storeIds(trayId, scheduledIds);
            console.log(`[Notif] Scheduled tray ${trayId} at ${scheduledTime} → IDs ${scheduledIds}`);
        } catch (err) {
            console.warn('[Notif] Failed to schedule:', err);
        }
        return;
    }

    // ── Browser fallback: Web Notifications + setTimeout ─────────────────────
    if ('Notification' in window) {
        if (Notification.permission === 'default') await Notification.requestPermission();
        if (Notification.permission === 'granted') {
            const fire = (at: Date, title: string, body: string) => {
                const delay = at.getTime() - Date.now();
                if (delay > 0) setTimeout(() => new Notification(title, { body, icon: '/favicon.ico' }), delay);
            };
            if (warningTime.getTime() > Date.now()) {
                fire(warningTime, '💊 Dose in 10 min', `Prepare: ${medicineName} — ${scheduledTime}`);
            }
            fire(doseTime, '🚨 Dose Time!', `Take ${medicineName} (${scheduledTime})`);
        }
    }
}

/**
 * Convenience: schedule notifications for all dose slots of a tray.
 */
export async function scheduleAllDoseNotifications(
    trayId: number,
    medicineName: string,
    doseTimes: string[],
): Promise<void> {
    for (const slot of doseTimes) {
        await scheduleAlarmNotification(trayId, medicineName, slot);
    }
}

/**
 * Cancel ONLY the notifications for a specific tray.
 * Other trays' notifications are unaffected.
 */
export async function cancelTrayNotifications(trayId: number): Promise<void> {
    const ids = getStoredIds(trayId);
    clearStoredIds(trayId);
    if (!Capacitor.isNativePlatform() || ids.length === 0) return;
    try {
        await LocalNotifications.cancel({ notifications: ids.map(id => ({ id })) });
        console.log(`[Notif] Cancelled tray ${trayId} IDs: ${ids}`);
    } catch (err) {
        console.warn('[Notif] Cancel failed:', err);
    }
}

/**
 * Cancel ALL pending notifications across all trays.
 */
export async function cancelAllNotifications(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    try {
        const pending = await LocalNotifications.getPending();
        if (pending.notifications.length > 0) {
            await LocalNotifications.cancel({ notifications: pending.notifications });
        }
    } catch (err) {
        console.warn('[Notif] Cancel all failed:', err);
    }
}
