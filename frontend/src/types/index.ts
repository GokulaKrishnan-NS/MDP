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
    scheduledTime?: string; // "HH:MM" 24-hour format
}

export interface CreateTrayInput {
    medicineName: string;
    pillsRemaining: number;
    threshold: number;
    pillsPerDose: number;
    dosesPerDay: number;
    durationDays: number;
    scheduledTime?: string; // "HH:MM" 24-hour format
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

export interface Hospital {
    id: number;
    name: string;
    address: string;
    phone: string | null;
    distance_km: string;
    maps_link: string;
}
