import { Router } from 'express';
import { iotState, IoTState } from '../iotState';

const router = Router();

// Helper to auto-reset requests older than 2 minutes
function checkAutoReset(state: IoTState) {
    if (state.dispenseRequested && state.requestedAt) {
        const age = Date.now() - state.requestedAt;
        if (age > 2 * 60_000) { // 2 minutes
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
    iotState.lastSeen = Date.now();
    checkAutoReset(iotState);
    console.log(`[IoT] /command polled – dispense=${iotState.dispenseRequested}`);
    res.json({ dispense: iotState.dispenseRequested });
});

/**
 * POST /api/iot/confirm
 * Called by ESP32 after servo rotation to acknowledge the dispense.
 * Resets the dispenseRequested flag and marks confirmed.
 */
router.post('/confirm', (_req, res) => {
    iotState.lastSeen = Date.now();
    console.log('[IoT] /confirm received');
    if (iotState.dispenseRequested) {
        iotState.dispenseRequested = false;
        iotState.confirmed = true;
        console.log('[IoT] Dispense confirmed by device');
    }
    res.json({ success: true });
});

export default router;
