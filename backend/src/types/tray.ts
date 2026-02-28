// Core data types shared across the entire backend

export type CompartmentStatus = 'ok' | 'low' | 'empty';

export interface Tray {
    trayId: number;
    medicineName: string;
    pillsRemaining: number;
    threshold: number;        // default 3 — triggers LOW_STOCK alarm
    pillsPerDose: number;
    dosesPerDay: number;
    durationDays: number;
    courseTotalRequired: number; // pillsPerDose * dosesPerDay * durationDays
    motorCommand: `TRAY_${number}_ROTATE`;
}

export interface CreateTrayInput {
    trayId?: number;
    medicineName: string;
    pillsRemaining: number;
    threshold?: number;
    pillsPerDose: number;
    dosesPerDay: number;
    durationDays: number;
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

export interface ApiResponse<T = unknown> {
    success: boolean;
    message: string;
    data?: T;
    errors?: string[];
}
