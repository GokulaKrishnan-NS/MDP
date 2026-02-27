"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduleStateMachine = void 0;
const ScheduleStatus_1 = require("../enums/ScheduleStatus");
class ScheduleStateMachine {
    /**
     * Evaluates and updates the schedule status based on pure time rules.
     * This is intended to be called before saving or during background sweeping.
     */
    static evaluateTimeBasedTransition(schedule, currentTime) {
        if (schedule.status === ScheduleStatus_1.ScheduleStatus.SCHEDULED) {
            if (schedule.isWithinDispenseWindow(currentTime)) {
                schedule.status = ScheduleStatus_1.ScheduleStatus.PENDING_WINDOW;
            }
            else if (schedule.isExpired(currentTime)) {
                schedule.status = ScheduleStatus_1.ScheduleStatus.MISSED;
            }
        }
        else if (schedule.status === ScheduleStatus_1.ScheduleStatus.PENDING_WINDOW) {
            if (schedule.isExpired(currentTime)) {
                schedule.status = ScheduleStatus_1.ScheduleStatus.MISSED;
            }
        }
    }
    /**
     * Validates if a user-initiated dispense action is valid based on state.
     */
    static canDispense(schedule, currentTime) {
        // Force evaluate the state first in case the background job hasn't run yet
        this.evaluateTimeBasedTransition(schedule, currentTime);
        return schedule.status === ScheduleStatus_1.ScheduleStatus.PENDING_WINDOW;
    }
}
exports.ScheduleStateMachine = ScheduleStateMachine;
