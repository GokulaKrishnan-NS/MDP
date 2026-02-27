"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Compartment = void 0;
class Compartment {
    id;
    deviceId;
    totalTablets;
    threshold;
    dailyDose;
    lowStockNotified;
    updatedAt;
    constructor(id, deviceId, totalTablets, threshold, dailyDose, lowStockNotified, updatedAt = new Date()) {
        this.id = id;
        this.deviceId = deviceId;
        this.totalTablets = totalTablets;
        this.threshold = threshold;
        this.dailyDose = dailyDose;
        this.lowStockNotified = lowStockNotified;
        this.updatedAt = updatedAt;
    }
    hasSufficientStock(doseQuantity) {
        return this.totalTablets >= doseQuantity;
    }
    deductStock(doseQuantity) {
        if (!this.hasSufficientStock(doseQuantity)) {
            throw new Error(`Insufficient stock in compartment ${this.id}`);
        }
        this.totalTablets -= doseQuantity;
    }
    addStock(addedTablets) {
        if (addedTablets <= 0) {
            throw new Error(`Added tablets must be positive`);
        }
        this.totalTablets += addedTablets;
        this.lowStockNotified = false; // Reset flag on refill
    }
    isLowStock() {
        return this.totalTablets < this.threshold;
    }
    getRemainingDays() {
        if (this.dailyDose === 0)
            return Infinity;
        return Math.floor(this.totalTablets / this.dailyDose);
    }
    needsPredictiveRefillWarning() {
        return this.getRemainingDays() < 3;
    }
}
exports.Compartment = Compartment;
