import type { Tray, CreateTrayInput, Warning, DispenseResult } from '../types';

/**
 * Mock Dispense Engine — identical safety logic as the backend.
 * Runs 100% client-side. Used in Mock Mode.
 */
export function mockAddTray(trays: Tray[], input: CreateTrayInput): { tray: Tray; warnings: string[] } {
    const trayId = trays.length + 1;
    if (trays.some(t => t.medicineName.toLowerCase() === input.medicineName.toLowerCase())) {
        throw new Error(`Medicine "${input.medicineName}" is already assigned to a tray`);
    }
    const courseTotalRequired = input.pillsPerDose * input.dosesPerDay * input.durationDays;
    const warnings: string[] = [];
    if (input.pillsRemaining < courseTotalRequired) {
        warnings.push(`Initial stock (${input.pillsRemaining}) is below course requirement (${courseTotalRequired} pills). Refill recommended.`);
    }
    const tray: Tray = {
        trayId,
        medicineName: input.medicineName.trim(),
        pillsRemaining: input.pillsRemaining,
        threshold: input.threshold,
        pillsPerDose: input.pillsPerDose,
        dosesPerDay: input.dosesPerDay,
        durationDays: input.durationDays,
        courseTotalRequired,
        motorCommand: `TRAY_${trayId}_ROTATE`,
    };
    return { tray, warnings };
}

export function mockDispense(trays: Tray[], medicineName: string): {
    trays: Tray[];
    result: DispenseResult;
} {
    const idx = trays.findIndex(t => t.medicineName.toLowerCase() === medicineName.toLowerCase());
    if (idx === -1) throw new Error(`No tray found for medicine: "${medicineName}"`);

    const tray = trays[idx];
    if (tray.pillsRemaining <= 0) throw new Error(`No pills remaining for "${medicineName}"`);

    const pillsAfter = tray.pillsRemaining - tray.pillsPerDose;
    const updated = { ...tray, pillsRemaining: pillsAfter };
    const updatedTrays = trays.map((t, i) => (i === idx ? updated : t));

    const warnings: Warning[] = [];
    if (pillsAfter <= tray.threshold) {
        warnings.push({
            type: 'LOW_STOCK',
            message: `Low stock: only ${pillsAfter} pill(s) remaining (threshold: ${tray.threshold})`,
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

    const result: DispenseResult = {
        success: true,
        trayId: tray.trayId,
        medicineName: tray.medicineName,
        pillsRemaining: pillsAfter,
        pillsDispensed: tray.pillsPerDose,
        warnings,
        motorCommand: tray.motorCommand,
        mode: 'mock',
    };

    return { trays: updatedTrays, result };
}
