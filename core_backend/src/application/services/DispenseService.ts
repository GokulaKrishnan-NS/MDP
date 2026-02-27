import { Database } from '../../infrastructure/database/Database';
import { DispenseRepository } from '../../infrastructure/repositories/DispenseRepository';

export class DispenseService {
    /**
     * Orchestrates the secure, idempotent dispense flow.
     * Handles the DB transaction and pure logic coordination.
     */
    public static async dispenseDose(scheduleId: string, idempotencyKey: string): Promise<void> {
        const currentTime = new Date(); // Enforce UTC server time as the absolute source of truth

        // We execute the entire check, deduct, log, and state change within one ACID transaction.
        // If anything fails, it fully rolls back, ensuring no partial state.
        await Database.transaction(async (client) => {
            await DispenseRepository.executeDispense(
                client,
                scheduleId,
                idempotencyKey,
                currentTime
            );
        });
    }

}
