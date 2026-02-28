import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Tray, AppMode, EmergencyContact, Warning } from '../types';
import { mockAddTray, mockDispense } from '../engine/mockEngine';
import { findActiveDoseSlot, getNearestBlockedReason, isWithinDoseWindow } from '../utils/timeWindow';
import { logDispenseEvent } from '../utils/historyManager';
import { isDoseTaken, markDoseTaken, clearExpiredDoseKeys } from '../utils/doseTracker';

// Clean up stale dose keys on store load
clearExpiredDoseKeys();

interface AlarmState {
    active: boolean;
    warnings: Warning[];
    medicineName: string;
}

interface AppState {
    mode: AppMode;
    trays: Tray[];
    alarm: AlarmState;
    contacts: EmergencyContact[];

    setMode: (mode: AppMode) => void;
    addTray: (input: Parameters<typeof mockAddTray>[1]) => { warnings: string[] };
    removeTray: (trayId: number) => void;
    dispense: (medicineName: string) => void;
    acknowledgeAlarm: () => void;
    addContact: (name: string, phone: string) => void;
    removeContact: (id: string) => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set, get) => ({
            mode: null,
            trays: [],
            alarm: { active: false, warnings: [], medicineName: '' },
            contacts: [],

            setMode: (mode) => set({ mode }),

            addTray: (input) => {
                const { tray, warnings } = mockAddTray(get().trays, input);
                set(s => ({ trays: [...s.trays, tray] }));
                return { warnings };
            },

            removeTray: (trayId) => set(s => ({ trays: s.trays.filter(t => t.trayId !== trayId) })),

            dispense: (medicineName) => {
                const currentTrays = get().trays;
                const tray = currentTrays.find(t => t.medicineName.toLowerCase() === medicineName.toLowerCase());

                // ── Resolve doseTimes (new) or scheduledTime (legacy) ─────────
                // Ensure persisted trays that lack doseTimes still work
                const doseTimes: string[] = tray
                    ? (Array.isArray(tray.doseTimes) && tray.doseTimes.length > 0)
                        ? tray.doseTimes
                        : tray.scheduledTime
                            ? [tray.scheduledTime]
                            : []
                    : [];

                // ── Time-window guard ─────────────────────────────────────────
                if (doseTimes.length > 0) {
                    const active = findActiveDoseSlot(doseTimes);
                    if (!active) {
                        // No slot is in-window right now
                        const reason = getNearestBlockedReason(doseTimes);
                        if (tray) logDispenseEvent(
                            { trayId: tray.trayId, medicineName: tray.medicineName, pillsPerDose: tray.pillsPerDose },
                            tray.pillsPerDose,
                            'blocked-early',
                        );
                        throw new Error(reason);
                    }

                    // ── Duplicate-dose prevention ─────────────────────────────
                    if (tray && isDoseTaken(tray.trayId, active.slot)) {
                        throw new Error(`✅ This dose (${active.slot}) has already been taken. Next dose: ${getNearestBlockedReason(doseTimes)}`);
                    }
                } else if (tray?.scheduledTime) {
                    // Legacy single-time path
                    const windowResult = isWithinDoseWindow(tray.scheduledTime);
                    if (!windowResult.ok) {
                        logDispenseEvent(
                            { trayId: tray.trayId, medicineName: tray.medicineName, pillsPerDose: tray.pillsPerDose },
                            tray.pillsPerDose,
                            windowResult.status as 'blocked-early' | 'blocked-late',
                        );
                        throw new Error(windowResult.message);
                    }
                    if (tray && isDoseTaken(tray.trayId, tray.scheduledTime)) {
                        throw new Error(`✅ This dose (${tray.scheduledTime}) has already been taken today.`);
                    }
                }

                // ── Dispense ──────────────────────────────────────────────────
                const { trays, result } = mockDispense(currentTrays, medicineName);
                set({ trays });

                if (result.warnings.length > 0) {
                    set({ alarm: { active: true, warnings: result.warnings, medicineName } });
                }

                // ── Mark taken + log success ──────────────────────────────────
                if (tray) {
                    const activeSlot = doseTimes.length > 0
                        ? findActiveDoseSlot(doseTimes)?.slot ?? tray.scheduledTime
                        : tray.scheduledTime;

                    if (activeSlot) markDoseTaken(tray.trayId, activeSlot);

                    logDispenseEvent(
                        { trayId: tray.trayId, medicineName: tray.medicineName, pillsPerDose: tray.pillsPerDose },
                        tray.pillsPerDose,
                        'success',
                    );
                }
            },

            acknowledgeAlarm: () => {
                try {
                    set({ alarm: { active: false, warnings: [], medicineName: '' } });
                } catch { /* never crash on acknowledge */ }
            },

            addContact: (name, phone) => {
                const contacts = get().contacts;
                if (contacts.some(c => c.phone === phone)) throw new Error('Contact already exists');
                set(s => ({
                    contacts: [...s.contacts, {
                        id: Math.random().toString(36).slice(2),
                        name: name.trim(),
                        phone: phone.trim(),
                    }],
                }));
            },

            removeContact: (id) => set(s => ({ contacts: s.contacts.filter(c => c.id !== id) })),
        }),
        {
            name: 'medicine-dispenser-state',
            // Migrate persisted trays that lack doseTimes
            migrate: (persistedState: any) => {
                if (persistedState?.trays) {
                    persistedState.trays = persistedState.trays.map((t: any) => ({
                        ...t,
                        doseTimes: Array.isArray(t.doseTimes) && t.doseTimes.length > 0
                            ? t.doseTimes
                            : t.scheduledTime ? [t.scheduledTime] : [],
                    }));
                }
                return persistedState;
            },
            version: 2,
        }
    )
);
