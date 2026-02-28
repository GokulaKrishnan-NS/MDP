import { Request, Response } from 'express';
import { z } from 'zod';
import { executeDose } from '../engine/dispenseEngine';

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
            res.json({ success: true, message: 'Dose dispensed', data: result });
        } catch (err: any) {
            const status = err.status ?? 500;
            res.status(status).json({ success: false, message: err.message ?? 'Dispense failed' });
        }
    }
}
