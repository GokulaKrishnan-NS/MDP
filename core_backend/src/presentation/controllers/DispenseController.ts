import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { DispenseService } from '../../application/services/DispenseService';

// Schema for request validation
const DispenseRequestSchema = z.object({
    schedule_id: z.string().uuid(),
    timestamp: z.string().datetime() // Validates ISO 8601 format
});

export class DispenseController {
    public static async executeDispense(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const idempotencyKey = req.headers['x-idempotency-key'] as string;
            if (!idempotencyKey || !z.string().uuid().safeParse(idempotencyKey).success) {
                res.status(400).json({ error: 'Missing or invalid X-Idempotency-Key header' });
                return;
            }

            const parsedBody = DispenseRequestSchema.parse(req.body);

            // Attempt the dispense. Any Domain or DB transaction errors will be caught in the catch block.
            await DispenseService.dispenseDose(
                parsedBody.schedule_id,
                idempotencyKey
            );

            res.status(200).json({
                success: true,
                message: 'Dose successfully dispensed'
            });
        } catch (error: any) {
            // Map domain errors to proper HTTP Status Codes
            if (error.message.includes('Idempotency key')) {
                res.status(409).json({ success: false, message: 'Conflict: Request already processed' });
            } else if (error.message.includes('outside valid dispense window')) {
                res.status(403).json({ success: false, message: 'Forbidden: Outside of valid dispense window' });
            } else if (error.message.includes('already dispensed')) {
                res.status(409).json({ success: false, message: 'Conflict: Schedule is already dispensed' });
            } else if (error.message.includes('Insufficient stock')) {
                res.status(422).json({ success: false, message: 'Unprocessable Entity: Insufficient stock' });
            } else if (error instanceof z.ZodError) {
                res.status(400).json({ success: false, message: 'Validation Error', data: (error as any).errors });
            } else {
                // Unhandled DB or server errors
                console.error('Unhandled Server Error: ', error);
                res.status(500).json({ success: false, message: 'Internal Server Error' });
            }
        }
    }
}
