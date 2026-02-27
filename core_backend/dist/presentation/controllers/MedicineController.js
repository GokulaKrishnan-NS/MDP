"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MedicineController = void 0;
const zod_1 = require("zod");
const Database_1 = require("../../infrastructure/database/Database");
// Validation Schema for incoming medicine from frontend AddMedicineDialog
const CreateMedicineSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    dosage: zod_1.z.string().min(1),
    compartment: zod_1.z.number().int().min(1),
    startDate: zod_1.z.string(), // YYYY-MM-DD
    endDate: zod_1.z.string(), // YYYY-MM-DD
    times: zod_1.z.array(zod_1.z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)) // Array of HH:MM
});
class MedicineController {
    // Create new medicine and bulk insert its schedules
    static async createMedicine(req, res, next) {
        const client = await Database_1.Database.getClient();
        try {
            const parsedBody = CreateMedicineSchema.parse(req.body);
            const userId = 'aa5f877d-7718-47f2-8c11-1402db39df91'; // Mock user
            // Transaction: Insert medicine -> Find proper compartment mapping -> Generate schedules for range
            await client.query('BEGIN');
            console.log(`Creating medicine ${parsedBody.name} for user ${userId}`);
            // 1. We mock the compartment UUID resolution based on the slot number
            // In a real database, we'd look up the device's compartments. We'll use the seeded static compartment.
            const compartmentId = 'c0a80121-7b8e-4a11-8c44-3b1a2b3c4d5e';
            // 2. Insert the Medicine
            const medQuery = `
                INSERT INTO medicines (user_id, name, dosage, compartment_id, start_date, end_date)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id;
            `;
            const medValues = [
                userId,
                parsedBody.name,
                parsedBody.dosage,
                compartmentId,
                parsedBody.startDate,
                parsedBody.endDate
            ];
            const medResult = await client.query(medQuery, medValues);
            const medicineId = medResult.rows[0].id;
            // 3. Generate Schedules for everyday between start and end (For sake of simplicity, we just generate schedules for exactly today and tomorrow based on times)
            // A genuine recurrence engine would be a cron or advanced logic to scale.
            for (const timeStr of parsedBody.times) {
                // Today
                const scheduleQuery = `
                    INSERT INTO schedules (compartment_id, scheduled_time, dose_quantity, status, medicine_id)
                    VALUES ($1, CURRENT_DATE + $2::time, 1, 'SCHEDULED', $3)
                `;
                await client.query(scheduleQuery, [compartmentId, timeStr, medicineId]);
                // Tomorrow
                const scheduleTomorrow = `
                    INSERT INTO schedules (compartment_id, scheduled_time, dose_quantity, status, medicine_id)
                    VALUES ($1, CURRENT_DATE + INTERVAL '1 day' + $2::time, 1, 'SCHEDULED', $3)
                `;
                await client.query(scheduleTomorrow, [compartmentId, timeStr, medicineId]);
            }
            await client.query('COMMIT');
            res.status(201).json({
                success: true,
                message: 'Medicine and schedules created successfully',
                data: { id: medicineId }
            });
        }
        catch (error) {
            await client.query('ROLLBACK');
            if (error instanceof zod_1.z.ZodError) {
                res.status(400).json({ success: false, message: 'Validation Error', data: error.errors });
            }
            else {
                console.error('Error creating medicine: ', error);
                res.status(500).json({ success: false, message: 'Internal Server Error' });
            }
        }
        finally {
            client.release();
        }
    }
}
exports.MedicineController = MedicineController;
