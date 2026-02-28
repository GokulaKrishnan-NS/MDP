/**
 * Time-window utility for dose scheduling.
 *
 * Allowed window:
 *   - 10 minutes BEFORE scheduled time  (early-bird grace)
 *   - up to 60 minutes AFTER scheduled time (late grace)
 *
 * Outside that window dispense is blocked.
 */

export type DoseWindowStatus = 'ok' | 'blocked-early' | 'blocked-late';

export interface DoseWindowResult {
    ok: boolean;
    status: DoseWindowStatus;
    message: string;
    /** The exact HH:MM slot that matched (only set when ok=true or blocked-late) */
    matchedSlot?: string;
}

/**
 * @param scheduledTime  "HH:MM" in 24-hour format
 */
export function isWithinDoseWindow(scheduledTime: string): DoseWindowResult {
    const [hStr, mStr] = scheduledTime.split(':');
    const now = new Date();
    const scheduled = new Date(now);
    scheduled.setHours(Number(hStr), Number(mStr), 0, 0);

    const diffMs = now.getTime() - scheduled.getTime(); // positive = after, negative = before
    const diffMin = diffMs / 60_000;

    if (diffMin < -10) {
        const minutesUntil = Math.ceil(-diffMin);
        return {
            ok: false,
            status: 'blocked-early',
            message: `Too early — scheduled for ${scheduledTime}. Come back in ${minutesUntil} min.`,
        };
    }

    if (diffMin > 60) {
        const minutesAgo = Math.floor(diffMin);
        return {
            ok: false,
            status: 'blocked-late',
            message: `Missed window — dose was scheduled at ${scheduledTime} (${minutesAgo} min ago). Contact your doctor.`,
            matchedSlot: scheduledTime,
        };
    }

    return {
        ok: true,
        status: 'ok',
        message: `On time (scheduled ${scheduledTime}).`,
        matchedSlot: scheduledTime,
    };
}

/**
 * Scans multiple dose slots and returns the first one within the active window.
 * Returns null if no slot is currently active.
 */
export function findActiveDoseSlot(doseTimes: string[]): { slot: string; result: DoseWindowResult } | null {
    for (const slot of doseTimes) {
        const result = isWithinDoseWindow(slot);
        if (result.ok) return { slot, result };
    }
    return null;
}

/**
 * Returns the nearest upcoming slot message for a set of dose times,
 * used to give the user a meaningful "come back at HH:MM" error.
 */
export function getNearestBlockedReason(doseTimes: string[]): string {
    if (doseTimes.length === 0) return 'No dose times configured.';

    const now = new Date();
    let nearest: { minutesUntil: number; slot: string } | null = null;

    for (const slot of doseTimes) {
        const [h, m] = slot.split(':').map(Number);
        const t = new Date(now);
        t.setHours(h, m, 0, 0);
        if (t <= now) t.setDate(t.getDate() + 1); // wrap to tomorrow if past
        const minutesUntil = Math.ceil((t.getTime() - now.getTime()) / 60_000);
        if (!nearest || minutesUntil < nearest.minutesUntil) {
            nearest = { minutesUntil, slot };
        }
    }

    return nearest
        ? `Next dose at ${nearest.slot} (in ${nearest.minutesUntil} min)`
        : 'No upcoming doses today.';
}

