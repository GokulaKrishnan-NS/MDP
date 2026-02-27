"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduleRepository = void 0;
const Schedule_1 = require("../../domain/entities/Schedule");
const ScheduleStatus_1 = require("../../domain/enums/ScheduleStatus");
const EventType_1 = require("../../domain/enums/EventType");
class ScheduleRepository {
    /**
     * Performs an atomic, idempotent dispense operation using row-level locks.
     * Lock sequence: Schedule -> Compartment
     * @throws Error on concurrent modification, insufficient stock, invalid state, or duplicate idempotency key.
     */
    static async dispenseDoseAtomically(client, scheduleId, idempotencyKey, currentTime) {
        // 1. Check idempotency key explicitly first (Optional, but good for immediate rejection)
        const checkIdempotency = await client.query(`SELECT id FROM schedules WHERE idempotency_key = $1 LIMIT 1`, [idempotencyKey]);
        if (checkIdempotency.rows.length > 0) {
            throw new Error(`Conflict: Idempotency key ${idempotencyKey} already used`);
        }
        // 2. Lock the schedule row
        const scheduleRes = await client.query(`SELECT id, compartment_id, scheduled_time, dose_quantity, status 
       FROM schedules 
       WHERE id = $1 FOR UPDATE NOWAIT`, [scheduleId]);
        if (scheduleRes.rows.length === 0) {
            throw new Error(`Schedule not found`);
        }
        const s = scheduleRes.rows[0];
        const schedule = new Schedule_1.Schedule(s.id, s.compartment_id, new Date(s.scheduled_time), s.dose_quantity, s.status);
        // Validate state based on purely time-based logic first
        if (schedule.status === ScheduleStatus_1.ScheduleStatus.DISPENSED) {
            throw new Error(`Conflict: Schedule already dispensed`);
        }
        if (!schedule.isWithinDispenseWindow(currentTime)) {
            throw new Error(`Schedule is outside valid dispense window.`);
        }
        // 3. Lock the compartment row
        const compartmentRes = await client.query(`SELECT id, total_tablets, threshold, daily_dose, low_stock_notified 
       FROM compartments 
       WHERE id = $1 FOR UPDATE`, [schedule.compartmentId]);
        if (compartmentRes.rows.length === 0) {
            throw new Error(`Compartment not found`);
        }
        const c = compartmentRes.rows[0];
        const totalTablets = parseInt(c.total_tablets, 10);
        const threshold = parseInt(c.threshold, 10);
        const dailyDose = parseInt(c.daily_dose, 10);
        let lowStockNotified = c.low_stock_notified;
        if (totalTablets < schedule.doseQuantity) {
            throw new Error(`Insufficient stock in compartment`);
        }
        // 4. Update compartment inventory
        const newTotalTablets = totalTablets - schedule.doseQuantity;
        let needsLowStockAlert = false;
        if (newTotalTablets < threshold && !lowStockNotified) {
            needsLowStockAlert = true;
            lowStockNotified = true; // Mark as notified
        }
        await client.query(`UPDATE compartments 
       SET total_tablets = $1, low_stock_notified = $2, updated_at = $3 
       WHERE id = $4`, [newTotalTablets, lowStockNotified, currentTime, schedule.compartmentId]);
        // 5. Update schedule state
        await client.query(`UPDATE schedules 
       SET status = $1, idempotency_key = $2, updated_at = $3 
       WHERE id = $4`, [ScheduleStatus_1.ScheduleStatus.DISPENSED, idempotencyKey, currentTime, scheduleId]);
        // 6. Insert immutable Audit Log
        const dispenseLogDetails = {
            deducted: schedule.doseQuantity,
            remaining: newTotalTablets
        };
        await client.query(`INSERT INTO audit_logs (schedule_id, compartment_id, event_type, details, created_at) 
       VALUES ($1, $2, $3, $4, $5)`, [scheduleId, schedule.compartmentId, EventType_1.EventType.DISPENSE_SUCCESS, JSON.stringify(dispenseLogDetails), currentTime]);
        // 7. Insert additional audit logs if alerts triggered
        if (needsLowStockAlert) {
            await client.query(`INSERT INTO audit_logs (compartment_id, event_type, details, created_at) 
         VALUES ($1, $2, $3, $4)`, [schedule.compartmentId, EventType_1.EventType.THRESHOLD_ALERT, JSON.stringify({ remaining: newTotalTablets, threshold }), currentTime]);
        }
    }
    /**
     * Refill a compartment, updating inventory and resetting low stock flag
     */
    static async refillCompartment(client, compartmentId, addedTablets, currentTime) {
        const compartmentRes = await client.query(`SELECT total_tablets FROM compartments WHERE id = $1 FOR UPDATE`, [compartmentId]);
        if (compartmentRes.rows.length === 0) {
            throw new Error(`Compartment not found`);
        }
        const newTotal = parseInt(compartmentRes.rows[0].total_tablets, 10) + addedTablets;
        await client.query(`UPDATE compartments 
       SET total_tablets = $1, low_stock_notified = FALSE, updated_at = $2 
       WHERE id = $3`, [newTotal, currentTime, compartmentId]);
        await client.query(`INSERT INTO audit_logs (compartment_id, event_type, details, created_at) 
       VALUES ($1, $2, $3, $4)`, [compartmentId, EventType_1.EventType.REFILL, JSON.stringify({ added: addedTablets, newTotal }), currentTime]);
    }
}
exports.ScheduleRepository = ScheduleRepository;
