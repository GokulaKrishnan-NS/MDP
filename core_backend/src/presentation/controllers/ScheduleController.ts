import { Request, Response, NextFunction } from 'express';
import { Database } from '../../infrastructure/database/Database';

export class ScheduleController {

    // Fetch schedules for the current day for a given user
    public static async getDailySchedules(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // Hardcoded user ID for phase 3 standalone testing
            const userId = 'aa5f877d-7718-47f2-8c11-1402db39df91';

            // Fetch schedules for the current day.
            // A schedule is considered 'dispensed' (taken) if there's a record in dispense_history for today.
            // If the time has passed and no history, it's 'missed'. Otherwise 'scheduled'.
            const query = `
                SELECT 
                    ms.id AS "id",
                    m.id AS "medication_id",
                    m.name AS "medicineName",
                    m.dosage AS "dosage",
                    to_char(ms.scheduled_time, 'HH24:MI') AS "scheduled_time",
                    to_char(CURRENT_DATE, 'YYYY-MM-DD') AS "date",
                    COALESCE(dh.status, 'scheduled') AS "status"
                FROM medication_schedules ms
                JOIN medications m ON ms.medication_id = m.id
                LEFT JOIN dispense_history dh 
                  ON dh.medication_id = m.id 
                 AND dh.scheduled_time = ms.scheduled_time
                 AND DATE(dh.created_at AT TIME ZONE 'UTC') = CURRENT_DATE
                WHERE m.user_id = $1
                ORDER BY ms.scheduled_time ASC;
            `;

            const result = await Database.query(query, [userId]);

            res.status(200).json({
                success: true,
                message: 'Fetched daily schedules successfully',
                data: result.rows
            });

        } catch (error: any) {
            console.error('Unhandled Server Error fetching schedules: ', error);
            res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    }
}
