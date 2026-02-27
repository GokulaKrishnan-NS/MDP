import { PoolClient } from 'pg';

export class DispenseRepository {
    /**
     * Performs an atomic, idempotent dispense operation using row-level locks.
     * Implements strict time window logic: T - 5 minutes <= CurrentTime <= T + 1 hour.
     */
    public static async executeDispense(
        client: PoolClient,
        scheduleId: string,
        idempotencyKey: string,
        currentTime: Date
    ): Promise<void> {
        // 1. Get the schedule
        const scheduleRes = await client.query(
            `SELECT ms.id, ms.medication_id, ms.scheduled_time, m.remaining_count 
             FROM medication_schedules ms
             JOIN medications m ON ms.medication_id = m.id
             WHERE ms.id = $1`,
            [scheduleId]
        );

        if (scheduleRes.rows.length === 0) {
            throw new Error(`Schedule not found`);
        }

        const schedule = scheduleRes.rows[0];
        const medicationId = schedule.medication_id;
        const scheduledTimeStr = schedule.scheduled_time; // HH:MM:SS format

        // Parse time to construct today's target Date object
        const targetDate = new Date(currentTime);
        const [hours, minutes, seconds] = scheduledTimeStr.split(':').map(Number);
        targetDate.setUTCHours(hours, minutes, seconds || 0, 0);

        // Calculate time window boundaries
        const earlyWindowTime = new Date(targetDate.getTime() - 5 * 60000);
        const lateWindowTime = new Date(targetDate.getTime() + 60 * 60000);

        // 2. Check duplicate dispense for today
        const historyRes = await client.query(
            `SELECT id, status FROM dispense_history 
             WHERE medication_id = $1 
               AND scheduled_time = $2 
               AND DATE(created_at AT TIME ZONE 'UTC') = DATE($3 AT TIME ZONE 'UTC')
               AND status = 'taken'
             LIMIT 1`,
            [medicationId, scheduledTimeStr, currentTime]
        );

        if (historyRes.rows.length > 0) {
            throw new Error(`Conflict: Schedule is already dispensed`);
        }

        // 3. Time Validation Checks
        if (currentTime < earlyWindowTime) {
            // Log blocked attempt
            await client.query(
                `INSERT INTO dispense_history (medication_id, scheduled_time, dispensed_at, status, message) 
                 VALUES ($1, $2, $3, 'blocked', 'Attempted too early')`,
                [medicationId, scheduledTimeStr, currentTime]
            );
            throw new Error(`It is not yet time to take your medicine.`);
        }

        if (currentTime > lateWindowTime) {
            // Log missed attempt
            await client.query(
                `INSERT INTO dispense_history (medication_id, scheduled_time, dispensed_at, status, message) 
                 VALUES ($1, $2, $3, 'missed', 'The scheduled time has passed. Please consult guidance.')`,
                [medicationId, scheduledTimeStr, currentTime]
            );
            throw new Error(`The scheduled time has passed. Please consult guidance.`);
        }

        // 4. Lock the medication row to update remaining_count
        const medRes = await client.query(
            `SELECT remaining_count FROM medications WHERE id = $1 FOR UPDATE NOWAIT`,
            [medicationId]
        );

        const currentRemaining = medRes.rows[0].remaining_count;

        if (currentRemaining <= 0) {
            throw new Error(`Insufficient stock in compartment`);
        }

        // 5. Deduct inventory
        await client.query(
            `UPDATE medications SET remaining_count = $1 WHERE id = $2`,
            [currentRemaining - 1, medicationId]
        );

        // 6. Record successful dispense history
        await client.query(
            `INSERT INTO dispense_history (medication_id, scheduled_time, dispensed_at, status, message) 
             VALUES ($1, $2, $3, 'taken', 'Dispensed successfully')`,
            [medicationId, scheduledTimeStr, currentTime]
        );
    }
}
