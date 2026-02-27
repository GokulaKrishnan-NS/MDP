"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Schedule = void 0;
class Schedule {
    id;
    compartmentId;
    scheduledTime;
    doseQuantity;
    status;
    idempotencyKey;
    updatedAt;
    constructor(id, compartmentId, scheduledTime, doseQuantity, status, idempotencyKey = null, updatedAt = new Date()) {
        this.id = id;
        this.compartmentId = compartmentId;
        this.scheduledTime = scheduledTime;
        this.doseQuantity = doseQuantity;
        this.status = status;
        this.idempotencyKey = idempotencyKey;
        this.updatedAt = updatedAt;
    }
    isWithinDispenseWindow(currentTime, earlyWindowMinutes = 10, validWindowMinutes = 60) {
        const earlyWindowTime = new Date(this.scheduledTime.getTime() - earlyWindowMinutes * 60000);
        const expiredTime = new Date(this.scheduledTime.getTime() + validWindowMinutes * 60000);
        return currentTime >= earlyWindowTime && currentTime <= expiredTime;
    }
    isExpired(currentTime, validWindowMinutes = 60) {
        const expiredTime = new Date(this.scheduledTime.getTime() + validWindowMinutes * 60000);
        return currentTime > expiredTime;
    }
}
exports.Schedule = Schedule;
