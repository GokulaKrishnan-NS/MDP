import { Request, Response } from 'express';
import { z } from 'zod';
import { trayStore } from '../store/trayStore';
import { CreateTrayInput } from '../types/tray';

const TraySchema = z.object({
    trayId: z.number().int().positive().optional(),
    medicineName: z.string().min(1, 'Medicine name required'),
    pillsRemaining: z.number().int().min(1, 'Pills must be > 0'),
    threshold: z.number().int().min(1).optional(),
    pillsPerDose: z.number().int().min(1, 'Pills per dose must be > 0'),
    dosesPerDay: z.number().int().min(1, 'Doses per day must be > 0'),
    durationDays: z.number().int().min(1, 'Duration must be > 0'),
});

export class TrayController {
    static getAll(_req: Request, res: Response): void {
        res.json({ success: true, message: 'Trays retrieved', data: trayStore.getAll() });
    }

    static addTray(req: Request, res: Response): void {
        const parsed = TraySchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: parsed.error.errors.map(e => e.message),
            });
            return;
        }

        const input: CreateTrayInput = parsed.data;

        // Pre-check: warn if initial stock < course total
        const courseRequired = input.pillsPerDose * input.dosesPerDay * input.durationDays;
        const warnings: string[] = [];
        if (input.pillsRemaining < courseRequired) {
            warnings.push(
                `Initial stock (${input.pillsRemaining}) is below course requirement (${courseRequired} pills). Refill recommended.`
            );
        }
        if (input.threshold !== undefined && input.threshold >= input.pillsRemaining) {
            warnings.push(
                `Threshold (${input.threshold}) must be less than initial pills (${input.pillsRemaining}).`
            );
        }

        try {
            const tray = trayStore.add(input);
            res.status(201).json({ success: true, message: 'Tray added', data: tray, warnings });
        } catch (err: any) {
            res.status(409).json({ success: false, message: err.message });
        }
    }

    static initTrays(req: Request, res: Response): void {
        const body = z.array(TraySchema).safeParse(req.body);
        if (!body.success) {
            res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: body.error.errors.map(e => e.message),
            });
            return;
        }
        const trays = trayStore.replaceAll(body.data);
        res.json({ success: true, message: `${trays.length} tray(s) initialized`, data: trays });
    }

    static deleteTray(req: Request, res: Response): void {
        const id = parseInt(req.params.trayId ?? '', 10);
        if (isNaN(id)) {
            res.status(400).json({ success: false, message: 'Invalid tray ID' });
            return;
        }
        try {
            trayStore.remove(id);
            res.json({ success: true, message: `Tray ${id} removed` });
        } catch (err: any) {
            res.status(404).json({ success: false, message: err.message });
        }
    }
}
