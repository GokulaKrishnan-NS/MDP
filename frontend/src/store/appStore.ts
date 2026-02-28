import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Tray, AppMode, EmergencyContact, Warning } from '../types';
import { mockAddTray, mockDispense } from '../engine/mockEngine';

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
                const { trays, result } = mockDispense(get().trays, medicineName);
                set({ trays });
                if (result.warnings.length > 0) {
                    set({ alarm: { active: true, warnings: result.warnings, medicineName } });
                }
            },

            acknowledgeAlarm: () => set({ alarm: { active: false, warnings: [], medicineName: '' } }),

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
        { name: 'medicine-dispenser-state' }
    )
);
