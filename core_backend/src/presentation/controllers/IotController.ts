import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Database } from '../../infrastructure/database/Database';
import { DispenseRepository } from '../../infrastructure/repositories/DispenseRepository';

// Schema for IoT hardware validation
const IotDispenseSchema = z.object({
    device_token: z.string().min(1),
    medication_id: z.string().uuid()
});

export class IotController {

    // Authenticate and Dispense for IoT Devices
    public static async handleDeviceDispense(req: Request, res: Response, next: NextFunction): Promise<void> {
        const client = await Database.getClient();

        try {
            const parsedBody = IotDispenseSchema.parse(req.body);

            // 1. Authenticate Device using device_token
            const deviceQuery = `SELECT id, user_id FROM iot_devices WHERE device_token = $1 AND status = 'active'`;
            const deviceRes = await client.query(deviceQuery, [parsedBody.device_token]);

            if (deviceRes.rows.length === 0) {
                res.status(401).json({ success: false, message: 'Unauthorized device token or device offline' });
                client.release();
                return;
            }

            const device = deviceRes.rows[0];

            // 2. We need the matching schedule ID to reuse the core dispense logic
            // We search for today's schedule for this medication, checking if we are within the valid dispense window roughly now.
            const currentTime = new Date();

            // To reuse DispenseRepository, we first must locate the active medication_schedule row ID for this medication_id
            // Because IoT triggers only provide medication_id, we infer the schedule by time proximity
            const scheduleQuery = `
                SELECT id, scheduled_time 
                FROM medication_schedules 
                WHERE medication_id = $1
            `;
            const schedulesRes = await client.query(scheduleQuery, [parsedBody.medication_id]);

            if (schedulesRes.rows.length === 0) {
                res.status(404).json({ success: false, message: 'No schedules found for this medication' });
                client.release();
                return;
            }

            // Find the closest schedule time that is within window
            let validScheduleId: string | null = null;
            for (const schedule of schedulesRes.rows) {
                const targetDate = new Date(currentTime);
                const [hours, minutes, seconds] = schedule.scheduled_time.split(':').map(Number);
                targetDate.setUTCHours(hours, minutes, seconds || 0, 0);

                const earlyWindowTime = new Date(targetDate.getTime() - 5 * 60000);
                const lateWindowTime = new Date(targetDate.getTime() + 60 * 60000);

                if (currentTime >= earlyWindowTime && currentTime <= lateWindowTime) {
                    validScheduleId = schedule.id;
                    break;
                }
            }

            if (!validScheduleId) {
                res.status(403).json({ success: false, message: 'Forbidden: No schedule within valid dispense window right now' });
                client.release();
                return;
            }

            // 3. Delegate to exact same shared Dispense Transaction Logic
            await client.query('BEGIN');
            // We invent a random idempotency key since IoT doesn't send one
            const idempotencyKey = `iot-${crypto.randomUUID()}`;

            await DispenseRepository.executeDispense(
                client,
                validScheduleId,
                idempotencyKey,
                currentTime
            );

            // Update IoT Device last_seen status
            await client.query(`UPDATE iot_devices SET last_seen = $1 WHERE id = $2`, [currentTime, device.id]);

            await client.query('COMMIT');

            res.status(200).json({
                success: true,
                message: 'Device authorized and dose dispensed successfully'
            });

        } catch (error: any) {
            await client.query('ROLLBACK');

            if (error.message.includes('already dispensed')) {
                res.status(409).json({ success: false, message: 'Conflict: Schedule is already dispensed' });
            } else if (error.message.includes('Insufficient stock')) {
                res.status(422).json({ success: false, message: 'Unprocessable Entity: Insufficient stock' });
            } else if (error instanceof z.ZodError) {
                res.status(400).json({ success: false, message: 'Validation Error', data: (error as any).errors });
            } else {
                console.error('Unhandled IoT Server Error: ', error);
                res.status(500).json({ success: false, message: 'Internal Server Error' });
            }
        } finally {
            client.release();
        }
    }
}
