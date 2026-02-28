"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrayController = void 0;
const zod_1 = require("zod");
const trayStore_1 = require("../store/trayStore");
const TraySchema = zod_1.z.object({
    trayId: zod_1.z.number().int().positive().optional(),
    medicineName: zod_1.z.string().min(1, 'Medicine name required'),
    pillsRemaining: zod_1.z.number().int().min(1, 'Pills must be > 0'),
    threshold: zod_1.z.number().int().min(1).optional(),
    pillsPerDose: zod_1.z.number().int().min(1, 'Pills per dose must be > 0'),
    dosesPerDay: zod_1.z.number().int().min(1, 'Doses per day must be > 0'),
    durationDays: zod_1.z.number().int().min(1, 'Duration must be > 0'),
});
class TrayController {
    static getAll(_req, res) {
        res.json({ success: true, message: 'Trays retrieved', data: trayStore_1.trayStore.getAll() });
    }
    static addTray(req, res) {
        const parsed = TraySchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: parsed.error.errors.map(e => e.message),
            });
            return;
        }
        const input = parsed.data;
        // Pre-check: warn if initial stock < course total
        const courseRequired = input.pillsPerDose * input.dosesPerDay * input.durationDays;
        const warnings = [];
        if (input.pillsRemaining < courseRequired) {
            warnings.push(`Initial stock (${input.pillsRemaining}) is below course requirement (${courseRequired} pills). Refill recommended.`);
        }
        if (input.threshold !== undefined && input.threshold >= input.pillsRemaining) {
            warnings.push(`Threshold (${input.threshold}) must be less than initial pills (${input.pillsRemaining}).`);
        }
        try {
            const tray = trayStore_1.trayStore.add(input);
            res.status(201).json({ success: true, message: 'Tray added', data: tray, warnings });
        }
        catch (err) {
            res.status(409).json({ success: false, message: err.message });
        }
    }
    static initTrays(req, res) {
        const body = zod_1.z.array(TraySchema).safeParse(req.body);
        if (!body.success) {
            res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: body.error.errors.map(e => e.message),
            });
            return;
        }
        const trays = trayStore_1.trayStore.replaceAll(body.data);
        res.json({ success: true, message: `${trays.length} tray(s) initialized`, data: trays });
    }
    static deleteTray(req, res) {
        const id = parseInt(req.params.trayId ?? '', 10);
        if (isNaN(id)) {
            res.status(400).json({ success: false, message: 'Invalid tray ID' });
            return;
        }
        try {
            trayStore_1.trayStore.remove(id);
            res.json({ success: true, message: `Tray ${id} removed` });
        }
        catch (err) {
            res.status(404).json({ success: false, message: err.message });
        }
    }
}
exports.TrayController = TrayController;
