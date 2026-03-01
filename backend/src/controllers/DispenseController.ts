import { Request, Response } from 'express';
import { z } from 'zod';
import { executeDose } from '../engine/dispenseEngine';
import { iotState } from '../iotState';

const DispenseSchema = z.object({
    medicineName: z.string().min(1, 'Medicine name required'),
    mode: z.enum(['mock', 'iot']).default('iot'),
});

export class DispenseController {
    static async dispense(req: Request, res: Response): Promise<void> {
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
            const result = await executeDose(parsed.data.medicineName, parsed.data.mode);
            // preserve existing response behavior exactly
            res.json({ success: true, message: 'Dose dispensed', data: result });

            // ── IoT integration hook (runs in parallel to main flow) ──
            // set a flag that an ESP32 will later poll for.  Refresh the
            // timestamp even if a request is already pending so the auto-reset
            // timer is relative to the most recent user action.
            iotState.dispenseRequested = true;
            iotState.requestedAt = Date.now();
            iotState.confirmed = false;
        } catch (err: any) {
            const status = err.status ?? 500;
            res.status(status).json({ success: false, message: err.message ?? 'Dispense failed' });
        }
    }
}
