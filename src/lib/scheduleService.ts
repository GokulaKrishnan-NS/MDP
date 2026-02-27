/**
 * scheduleService.ts
 *
 * Centralized service for schedule time-window evaluation and dispense triggering.
 *
 * ARCHITECTURE NOTE (IoT Extension Point):
 * This is the single source of truth for determining whether a dispense can occur.
 * Future hardware triggers (ESP32, MQTT, WebSocket) should call `triggerDispense()`
 * rather than duplicating the validation logic inline in UI components.
 */

import { MedicineSchedule } from './types';

// ---- Types ----

export type DispenseWindowState =
    | { state: 'too_early'; minutesUntil: number; message: string }
    | { state: 'ready'; message: string }
    | { state: 'too_late'; minutesPast: number; message: string }
    | { state: 'taken'; message: string }
    | { state: 'missed'; message: string };

// ── Constants ─────────────────────────────────────────────────────────────────
const EARLY_WINDOW_MINUTES = 5;  // Allow dispensing up to 5 min early
const LATE_WINDOW_MINUTES = 60;  // Block dispensing after 60 min past

/**
 * Evaluates the current dispense window state for a given schedule.
 * This is the ONLY place that implements the time-window rule.
 * UI components and IoT hardware handlers both call this function.
 *
 * @param schedule - The medication schedule to evaluate
 * @param now - Optional override for current time (useful for testing)
 */
export function getDispenseWindowState(
    schedule: MedicineSchedule,
    now: Date = new Date()
): DispenseWindowState {
    // Handle already-taken or missed statuses from backend
    if (schedule.status === 'taken') {
        return { state: 'taken', message: 'This dose has already been dispensed.' };
    }
    if (schedule.status === 'missed') {
        return { state: 'missed', message: 'This dose was missed.' };
    }

    if (!schedule.scheduled_time) {
        return { state: 'too_early', minutesUntil: 0, message: 'Schedule time not available.' };
    }

    // Parse the scheduled_time (format: "HH:MM:SS" or "HH:MM")
    const parts = schedule.scheduled_time.split(':').map(Number);
    const targetTime = new Date(now);
    targetTime.setHours(parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0, 0);

    const diffMs = now.getTime() - targetTime.getTime();
    const diffMinutes = diffMs / 60000; // positive = past, negative = future

    if (diffMinutes < -EARLY_WINDOW_MINUTES) {
        const minutesUntil = Math.ceil(Math.abs(diffMinutes) - EARLY_WINDOW_MINUTES);
        return {
            state: 'too_early',
            minutesUntil,
            message: `It is not yet time to take this medicine. Available in ${minutesUntil} min.`,
        };
    }

    if (diffMinutes > LATE_WINDOW_MINUTES) {
        const minutesPast = Math.floor(diffMinutes - LATE_WINDOW_MINUTES);
        return {
            state: 'too_late',
            minutesPast,
            message: 'It is too late to take this medicine. Please consult your caregiver.',
        };
    }

    return {
        state: 'ready',
        message: 'Ready to dispense.',
    };
}

/**
 * IoT Extension Point — Placeholder WebSocket/MQTT interface.
 *
 * When hardware integration is added, this function will emit a dispense
 * command to the IoT broker. For now it is a no-op placeholder.
 *
 * DO NOT implement hardware logic here yet. This just prepares the extension point.
 */
export async function notifyIotDevice(scheduleId: string): Promise<void> {
    // TODO (Phase 7): Replace with WebSocket/MQTT emit when IoT hardware is connected
    // Example future implementation:
    // webSocket.send(JSON.stringify({ event: 'DISPENSE', scheduleId }));
    console.debug(`[IoT Placeholder] Dispense trigger for schedule: ${scheduleId}`);
}
