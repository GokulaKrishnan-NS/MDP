"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DispenseController = void 0;
const zod_1 = require("zod");
const dispenseEngine_1 = require("../engine/dispenseEngine");
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
            res.json({ success: true, message: 'Dose dispensed', data: result });
        }
        catch (err) {
            const status = err.status ?? 500;
            res.status(status).json({ success: false, message: err.message ?? 'Dispense failed' });
        }
    }
}
exports.DispenseController = DispenseController;
