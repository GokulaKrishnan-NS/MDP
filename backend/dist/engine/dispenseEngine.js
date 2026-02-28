"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeDose = executeDose;
const trayStore_1 = require("../store/trayStore");
const motorCommands_1 = require("../iot/motorCommands");
/**
 * Core dispense safety engine.
 * Backend re-validates ALL safety checks — never trust frontend alone.
 */
async function executeDose(medicineName, mode = 'iot') {
    // 1. Find tray
    const tray = trayStore_1.trayStore.getByMedicineName(medicineName);
    if (!tray) {
        throw { status: 404, message: `No tray found for medicine: "${medicineName}"` };
    }
    // 2. Check stock
    if (tray.pillsRemaining <= 0) {
        throw { status: 422, message: `No pills remaining in Tray ${tray.trayId} for "${medicineName}"` };
    }
    // 3. Deduct dose
    const pillsAfter = tray.pillsRemaining - tray.pillsPerDose;
    trayStore_1.trayStore.update(tray.trayId, { pillsRemaining: pillsAfter });
    // 4. Safety checks (run AFTER deduct so we report accurate remaining count)
    const warnings = [];
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
        await (0, motorCommands_1.dispatchMotorCommand)(tray.motorCommand);
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
