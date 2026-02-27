"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DispenseService = void 0;
const Database_1 = require("../../infrastructure/database/Database");
const ScheduleRepository_1 = require("../../infrastructure/repositories/ScheduleRepository");
class DispenseService {
    /**
     * Orchestrates the secure, idempotent dispense flow.
     * Handles the DB transaction and pure logic coordination.
     */
    static async dispenseDose(scheduleId, idempotencyKey) {
        const currentTime = new Date(); // Enforce UTC server time as the absolute source of truth
        // We execute the entire check, deduct, log, and state change within one ACID transaction.
        // If anything fails, it fully rolls back, ensuring no partial state.
        await Database_1.Database.transaction(async (client) => {
            await ScheduleRepository_1.ScheduleRepository.dispenseDoseAtomically(client, scheduleId, idempotencyKey, currentTime);
        });
        // NOTE: In a real system, you might trigger async events here (e.g. push notification, hardware command)
        // Only happens if the DB transaction COMMITs successfully.
    }
    /**
     * Orchestrates the compartment refill flow.
     */
    static async refillCompartment(compartmentId, addedTablets) {
        const currentTime = new Date();
        await Database_1.Database.transaction(async (client) => {
            await ScheduleRepository_1.ScheduleRepository.refillCompartment(client, compartmentId, addedTablets, currentTime);
        });
    }
}
exports.DispenseService = DispenseService;
