"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const iotState_1 = require("../iotState");
const router = (0, express_1.Router)();
// Helper to auto-reset requests older than 2 minutes
function checkAutoReset(state) {
    if (state.dispenseRequested && state.requestedAt) {
        const age = Date.now() - state.requestedAt;
        if (age > 2 * 60000) { // 2 minutes
            console.warn('[IoT] Dispense request expired, auto-resetting');
            state.dispenseRequested = false;
            state.confirmed = false;
            state.requestedAt = null;
        }
    }
}
/**
 * GET /api/iot/command
 * Polled by the ESP32 hardware. Returns whether a dispense command is waiting.
 * Also updates lastSeen and performs an auto-reset on stale requests.
 */
router.get('/command', (_req, res) => {
    iotState_1.iotState.lastSeen = Date.now();
    checkAutoReset(iotState_1.iotState);
    console.log(`[IoT] /command polled – dispense=${iotState_1.iotState.dispenseRequested}`);
    res.json({ dispense: iotState_1.iotState.dispenseRequested });
});
/**
 * POST /api/iot/confirm
 * Called by ESP32 after servo rotation to acknowledge the dispense.
 * Resets the dispenseRequested flag and marks confirmed.
 */
router.post('/confirm', (_req, res) => {
    iotState_1.iotState.lastSeen = Date.now();
    console.log('[IoT] /confirm received');
    if (iotState_1.iotState.dispenseRequested) {
        iotState_1.iotState.dispenseRequested = false;
        iotState_1.iotState.confirmed = true;
        console.log('[IoT] Dispense confirmed by device');
    }
    res.json({ success: true });
});
exports.default = router;
