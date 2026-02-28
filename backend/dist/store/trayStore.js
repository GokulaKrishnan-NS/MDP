"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trayStore = void 0;
/**
 * In-memory tray store — single source of truth for all tray state.
 * Each Tray maps 1:1 to a physical dispenser compartment.
 * Replace with PostgreSQL by changing the methods below.
 */
class TrayStore {
    constructor() {
        this.trays = new Map();
        this.nextId = 1;
    }
    getAll() {
        return Array.from(this.trays.values()).sort((a, b) => a.trayId - b.trayId);
    }
    getByMedicineName(name) {
        return Array.from(this.trays.values()).find(t => t.medicineName.toLowerCase() === name.toLowerCase());
    }
    getById(trayId) {
        return this.trays.get(trayId);
    }
    add(input) {
        const trayId = input.trayId ?? this.nextId;
        if (this.trays.has(trayId)) {
            throw new Error(`Tray ${trayId} already exists`);
        }
        // Check duplicate medicine name
        if (this.getByMedicineName(input.medicineName)) {
            throw new Error(`Medicine "${input.medicineName}" is already assigned to a tray`);
        }
        const courseTotalRequired = input.pillsPerDose * input.dosesPerDay * input.durationDays;
        const tray = {
            trayId,
            medicineName: input.medicineName.trim(),
            pillsRemaining: input.pillsRemaining,
            threshold: input.threshold ?? 3,
            pillsPerDose: input.pillsPerDose,
            dosesPerDay: input.dosesPerDay,
            durationDays: input.durationDays,
            courseTotalRequired,
            motorCommand: `TRAY_${trayId}_ROTATE`,
        };
        this.trays.set(trayId, tray);
        if (trayId >= this.nextId)
            this.nextId = trayId + 1;
        return tray;
    }
    update(trayId, patch) {
        const existing = this.trays.get(trayId);
        if (!existing)
            throw new Error(`Tray ${trayId} not found`);
        const updated = { ...existing, ...patch, trayId };
        this.trays.set(trayId, updated);
        return updated;
    }
    remove(trayId) {
        if (!this.trays.has(trayId))
            throw new Error(`Tray ${trayId} not found`);
        this.trays.delete(trayId);
    }
    replaceAll(inputs) {
        this.trays.clear();
        this.nextId = 1;
        return inputs.map(i => this.add(i));
    }
}
// Singleton — one store for the app lifetime
exports.trayStore = new TrayStore();
