// Shared types for the frontend

export type AppMode = 'mock' | 'iot' | null;

export interface Tray {
    trayId: number;
    medicineName: string;
    pillsRemaining: number;
    threshold: number;
    pillsPerDose: number;
    dosesPerDay: number;
    durationDays: number;
    courseTotalRequired: number;
    motorCommand: string;
    doseTimes: string[];         // ["HH:MM", ...] — one per dose per day
    scheduledTime?: string;      // @deprecated — kept for persisted data compat
}

export interface CreateTrayInput {
    medicineName: string;
    pillsRemaining: number;
    threshold: number;
    pillsPerDose: number;
    dosesPerDay: number;
    durationDays: number;
    doseTimes?: string[];         // ["HH:MM", ...]
    scheduledTime?: string;       // @deprecated — single slot fallback
}

export type WarningType = 'LOW_STOCK' | 'INSUFFICIENT_COURSE';

export interface Warning {
    type: WarningType;
    message: string;
    pillsRemaining?: number;
    threshold?: number;
    required?: number;
}

export interface DispenseResult {
    success: boolean;
    trayId: number;
    medicineName: string;
    pillsRemaining: number;
    pillsDispensed: number;
    warnings: Warning[];
    motorCommand: string;
    mode: 'iot' | 'mock';
}

export interface EmergencyContact {
    id: string;
    name: string;
    phone: string;
}


