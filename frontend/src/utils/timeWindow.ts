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
        };
    }

    return {
        ok: true,
        status: 'ok',
        message: `On time (scheduled ${scheduledTime}).`,
    };
}
