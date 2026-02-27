import { ScheduleStatus } from '../enums/ScheduleStatus';
import { Schedule } from '../entities/Schedule';

export class ScheduleStateMachine {
    /**
     * Evaluates and updates the schedule status based on pure time rules.
     * This is intended to be called before saving or during background sweeping.
     */
    public static evaluateTimeBasedTransition(schedule: Schedule, currentTime: Date): void {
        if (schedule.status === ScheduleStatus.SCHEDULED) {
            if (schedule.isWithinDispenseWindow(currentTime)) {
                schedule.status = ScheduleStatus.PENDING_WINDOW;
            } else if (schedule.isExpired(currentTime)) {
                schedule.status = ScheduleStatus.MISSED;
            }
        } else if (schedule.status === ScheduleStatus.PENDING_WINDOW) {
            if (schedule.isExpired(currentTime)) {
                schedule.status = ScheduleStatus.MISSED;
            }
        }
    }

    /**
     * Validates if a user-initiated dispense action is valid based on state.
     */
    public static canDispense(schedule: Schedule, currentTime: Date): boolean {
        // Force evaluate the state first in case the background job hasn't run yet
        this.evaluateTimeBasedTransition(schedule, currentTime);

        return schedule.status === ScheduleStatus.PENDING_WINDOW;
    }
}
