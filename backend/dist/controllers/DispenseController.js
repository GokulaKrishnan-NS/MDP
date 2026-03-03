"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DispenseController = void 0;
const zod_1 = require("zod");
const dispenseEngine_1 = require("../engine/dispenseEngine");
const iotState_1 = require("../iotState");
const DispenseSchema = zod_1.z.object({
    medicineName: zod_1.z.string().min(1, 'Medicine name required'),
    mode: zod_1.z.enum(['mock', 'iot']).default('iot'),
});
class DispenseController {
    static async dispense(req, res) {
        const parsed = DispenseSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: parsed.error.errors.map(e => e.message),
            });
            return;
        }
        try {
            const result = await (0, dispenseEngine_1.executeDose)(parsed.data.medicineName, parsed.data.mode);
            // preserve existing response behavior exactly
            res.json({ success: true, message: 'Dose dispensed', data: result });
            // ── IoT integration hook (runs in parallel to main flow) ──
            // set a flag that an ESP32 will later poll for.  Refresh the
            // timestamp even if a request is already pending so the auto-reset
            // timer is relative to the most recent user action.
            iotState_1.iotState.dispenseRequested = true;
            iotState_1.iotState.requestedAt = Date.now();
            iotState_1.iotState.confirmed = false;
        }
        catch (err) {
            const status = err.status ?? 500;
            res.status(status).json({ success: false, message: err.message ?? 'Dispense failed' });
        }
    }
}
exports.DispenseController = DispenseController;
