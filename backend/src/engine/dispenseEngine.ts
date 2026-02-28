import { trayStore } from '../store/trayStore';
import { Warning, DispenseResult } from '../types/tray';
import { dispatchMotorCommand } from '../iot/motorCommands';

/**
 * Core dispense safety engine.
 * Backend re-validates ALL safety checks — never trust frontend alone.
 */
export async function executeDose(
    medicineName: string,
    mode: 'iot' | 'mock' = 'iot'
): Promise<DispenseResult> {
    // 1. Find tray
    const tray = trayStore.getByMedicineName(medicineName);
    if (!tray) {
        throw { status: 404, message: `No tray found for medicine: "${medicineName}"` };
    }

    // 2. Check stock
    if (tray.pillsRemaining <= 0) {
        throw { status: 422, message: `No pills remaining in Tray ${tray.trayId} for "${medicineName}"` };
    }

    // 3. Deduct dose
    const pillsAfter = tray.pillsRemaining - tray.pillsPerDose;
    trayStore.update(tray.trayId, { pillsRemaining: pillsAfter });

    // 4. Safety checks (run AFTER deduct so we report accurate remaining count)
    const warnings: Warning[] = [];

    if (pillsAfter <= tray.threshold) {
        warnings.push({
            type: 'LOW_STOCK',
            message: `Low stock warning: only ${pillsAfter} pill(s) remaining (threshold: ${tray.threshold})`,
            pillsRemaining: pillsAfter,
            threshold: tray.threshold,
        });
    }

    if (pillsAfter < tray.courseTotalRequired) {
        warnings.push({
            type: 'INSUFFICIENT_COURSE',
            message: `Insufficient for full course: ${pillsAfter} remaining, ${tray.courseTotalRequired} required`,
            pillsRemaining: pillsAfter,
            required: tray.courseTotalRequired,
        });
    }

    // 5. Dispatch motor command (IoT mode only)
    if (mode === 'iot') {
        await dispatchMotorCommand(tray.motorCommand);
    }

    return {
        success: true,
        trayId: tray.trayId,
        medicineName: tray.medicineName,
        pillsRemaining: pillsAfter,
        pillsDispensed: tray.pillsPerDose,
        warnings,
        motorCommand: tray.motorCommand,
        mode,
    };
}
