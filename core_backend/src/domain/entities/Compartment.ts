export class Compartment {
    constructor(
        public readonly id: string,
        public readonly deviceId: string,
        public totalTablets: number,
        public readonly threshold: number,
        public readonly dailyDose: number,
        public lowStockNotified: boolean,
        public updatedAt: Date = new Date()
    ) { }

    public hasSufficientStock(doseQuantity: number): boolean {
        return this.totalTablets >= doseQuantity;
    }

    public deductStock(doseQuantity: number): void {
        if (!this.hasSufficientStock(doseQuantity)) {
            throw new Error(`Insufficient stock in compartment ${this.id}`);
        }
        this.totalTablets -= doseQuantity;
    }

    public addStock(addedTablets: number): void {
        if (addedTablets <= 0) {
            throw new Error(`Added tablets must be positive`);
        }
        this.totalTablets += addedTablets;
        this.lowStockNotified = false; // Reset flag on refill
    }

    public isLowStock(): boolean {
        return this.totalTablets < this.threshold;
    }

    public getRemainingDays(): number {
        if (this.dailyDose === 0) return Infinity;
        return Math.floor(this.totalTablets / this.dailyDose);
    }

    public needsPredictiveRefillWarning(): boolean {
        return this.getRemainingDays() < 3;
    }
}
