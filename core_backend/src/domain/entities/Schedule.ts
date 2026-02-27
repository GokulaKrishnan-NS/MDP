import { ScheduleStatus } from '../enums/ScheduleStatus';

export class Schedule {
    constructor(
        public readonly id: string,
        public readonly compartmentId: string,
        public readonly scheduledTime: Date,
        public readonly doseQuantity: number,
        public status: ScheduleStatus,
        public idempotencyKey: string | null = null,
        public updatedAt: Date = new Date()
    ) { }

    public isWithinDispenseWindow(currentTime: Date, earlyWindowMinutes: number = 10, validWindowMinutes: number = 60): boolean {
        const earlyWindowTime = new Date(this.scheduledTime.getTime() - earlyWindowMinutes * 60000);
        const expiredTime = new Date(this.scheduledTime.getTime() + validWindowMinutes * 60000);

        return currentTime >= earlyWindowTime && currentTime <= expiredTime;
    }

    public isExpired(currentTime: Date, validWindowMinutes: number = 60): boolean {
        const expiredTime = new Date(this.scheduledTime.getTime() + validWindowMinutes * 60000);
        return currentTime > expiredTime;
    }
}
