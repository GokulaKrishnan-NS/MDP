import { Tray, CreateTrayInput } from '../types/tray';

/**
 * In-memory tray store — single source of truth for all tray state.
 * Each Tray maps 1:1 to a physical dispenser compartment.
 * Replace with PostgreSQL by changing the methods below.
 */
class TrayStore {
    private trays: Map<number, Tray> = new Map();
    private nextId = 1;

    getAll(): Tray[] {
        return Array.from(this.trays.values()).sort((a, b) => a.trayId - b.trayId);
    }

    getByMedicineName(name: string): Tray | undefined {
        return Array.from(this.trays.values()).find(
            t => t.medicineName.toLowerCase() === name.toLowerCase()
        );
    }

    getById(trayId: number): Tray | undefined {
        return this.trays.get(trayId);
    }

    add(input: CreateTrayInput): Tray {
        const trayId = input.trayId ?? this.nextId;
        if (this.trays.has(trayId)) {
            throw new Error(`Tray ${trayId} already exists`);
        }
        // Check duplicate medicine name
        if (this.getByMedicineName(input.medicineName)) {
            throw new Error(`Medicine "${input.medicineName}" is already assigned to a tray`);
        }

        const courseTotalRequired = input.pillsPerDose * input.dosesPerDay * input.durationDays;

        const tray: Tray = {
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
        if (trayId >= this.nextId) this.nextId = trayId + 1;
        return tray;
    }

    update(trayId: number, patch: Partial<Tray>): Tray {
        const existing = this.trays.get(trayId);
        if (!existing) throw new Error(`Tray ${trayId} not found`);
        const updated = { ...existing, ...patch, trayId };
        this.trays.set(trayId, updated);
        return updated;
    }

    remove(trayId: number): void {
        if (!this.trays.has(trayId)) throw new Error(`Tray ${trayId} not found`);
        this.trays.delete(trayId);
    }

    replaceAll(inputs: CreateTrayInput[]): Tray[] {
        this.trays.clear();
        this.nextId = 1;
        return inputs.map(i => this.add(i));
    }
}

// Singleton — one store for the app lifetime
export const trayStore = new TrayStore();
