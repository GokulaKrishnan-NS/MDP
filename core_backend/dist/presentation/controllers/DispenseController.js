"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DispenseController = void 0;
const zod_1 = require("zod");
const DispenseService_1 = require("../../application/services/DispenseService");
// Schema for request validation
const DispenseRequestSchema = zod_1.z.object({
    schedule_id: zod_1.z.string().uuid(),
    timestamp: zod_1.z.string().datetime() // Validates ISO 8601 format
});
class DispenseController {
    static async executeDispense(req, res, next) {
        try {
            const idempotencyKey = req.headers['x-idempotency-key'];
            if (!idempotencyKey || !zod_1.z.string().uuid().safeParse(idempotencyKey).success) {
                res.status(400).json({ error: 'Missing or invalid X-Idempotency-Key header' });
                return;
            }
            const parsedBody = DispenseRequestSchema.parse(req.body);
            // Attempt the dispense. Any Domain or DB transaction errors will be caught in the catch block.
            await DispenseService_1.DispenseService.dispenseDose(parsedBody.schedule_id, idempotencyKey);
            res.status(200).json({
                success: true,
                message: 'Dose successfully dispensed'
            });
        }
        catch (error) {
            // Map domain errors to proper HTTP Status Codes
            if (error.message.includes('Idempotency key')) {
                res.status(409).json({ success: false, message: 'Conflict: Request already processed' });
            }
            else if (error.message.includes('outside valid dispense window')) {
                res.status(403).json({ success: false, message: 'Forbidden: Outside of valid dispense window' });
            }
            else if (error.message.includes('already dispensed')) {
                res.status(409).json({ success: false, message: 'Conflict: Schedule is already dispensed' });
            }
            else if (error.message.includes('Insufficient stock')) {
                res.status(422).json({ success: false, message: 'Unprocessable Entity: Insufficient stock' });
            }
            else if (error instanceof zod_1.z.ZodError) {
                res.status(400).json({ success: false, message: 'Validation Error', data: error.errors });
            }
            else {
                // Unhandled DB or server errors
                console.error('Unhandled Server Error: ', error);
                res.status(500).json({ success: false, message: 'Internal Server Error' });
            }
        }
    }
}
exports.DispenseController = DispenseController;
