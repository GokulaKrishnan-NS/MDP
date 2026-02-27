import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Database } from '../../infrastructure/database/Database';

// Validation Schema for incoming medicine from frontend AddMedicineDialog
const CreateMedicineSchema = z.object({
    name: z.string().min(1),
    dosage: z.string().min(1),
    compartment: z.number().int().min(1),
    startDate: z.string(), // YYYY-MM-DD
    endDate: z.string(),   // YYYY-MM-DD
    times: z.array(z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)) // Array of HH:MM
});

export class MedicineController {

    // Create new medicine and bulk insert its schedules
    public static async createMedicine(req: Request, res: Response, next: NextFunction): Promise<void> {
        const client = await Database.getClient();

        try {
            const parsedBody = CreateMedicineSchema.parse(req.body);
            const userId = 'aa5f877d-7718-47f2-8c11-1402db39df91'; // Mock user

            // Transaction: Insert medicine -> Find proper compartment mapping -> Generate schedules for range
            await client.query('BEGIN');

            console.log(`Creating medicine ${parsedBody.name} for user ${userId}`);

            // 1. Insert the Medication
            const medQuery = `
                INSERT INTO medications (user_id, name, dosage, frequency, total_count, remaining_count, start_date)
                VALUES ($1, $2, $3, $4, $5, $5, $6)
                RETURNING id;
            `;
            const frequency = `${parsedBody.times.length} times daily`;

            // Assume initial total_count of pills is 30 for simplicity of mock
            const initialTotalCount = 30;

            const medValues = [
                userId,
                parsedBody.name,
                parsedBody.dosage,
                frequency,
                initialTotalCount,
                parsedBody.startDate
            ];
            const medResult = await client.query(medQuery, medValues);
            const medicationId = medResult.rows[0].id;

            // 2. Insert medication schedules for the daily times requested
            for (const timeStr of parsedBody.times) {
                const scheduleQuery = `
                    INSERT INTO medication_schedules (medication_id, scheduled_time)
                    VALUES ($1, $2::time)
                `;
                await client.query(scheduleQuery, [medicationId, timeStr]);
            }

            await client.query('COMMIT');

            res.status(201).json({
                success: true,
                message: 'Medication and schedules created successfully',
                data: { id: medicationId }
            });

        } catch (error: any) {
            await client.query('ROLLBACK');
            if (error instanceof z.ZodError) {
                res.status(400).json({ success: false, message: 'Validation Error', data: (error as any).errors });
            } else {
                console.error('Error creating medicine: ', error);
                res.status(500).json({ success: false, message: 'Internal Server Error' });
            }
        } finally {
            client.release();
        }
    }
}
