"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduleController = void 0;
const Database_1 = require("../../infrastructure/database/Database");
class ScheduleController {
    // Fetch schedules for the current day for a given user
    static async getDailySchedules(req, res, next) {
        try {
            // Hardcoded user ID for phase 3 standalone testing
            const userId = 'aa5f877d-7718-47f2-8c11-1402db39df91';
            // We need to fetch schedules that fall on the current UTC day
            const query = `
                SELECT 
                    s.id AS "id",
                    m.id AS "medicineId",
                    m.name AS "medicineName",
                    m.dosage AS "dosage",
                    m.compartment_id AS "compartment",
                    to_char(s.scheduled_time AT TIME ZONE 'UTC', 'HH24:MI') AS "scheduledTime",
                    s.status AS "status",
                    to_char(s.scheduled_time AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS "date"
                FROM schedules s
                JOIN medicines m ON s.medicine_id = m.id
                WHERE m.user_id = $1
                  AND DATE(s.scheduled_time AT TIME ZONE 'UTC') = CURRENT_DATE
                ORDER BY s.scheduled_time ASC;
            `;
            const result = await Database_1.Database.query(query, [userId]);
            res.status(200).json({
                success: true,
                message: 'Fetched daily schedules successfully',
                data: result.rows
            });
        }
        catch (error) {
            console.error('Unhandled Server Error fetching schedules: ', error);
            res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    }
}
exports.ScheduleController = ScheduleController;
