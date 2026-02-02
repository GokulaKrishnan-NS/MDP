import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MedicineSchedule, HistoryLog } from './types';

interface Medicine {
    id: string;
    name: string;
    dosage: string;
    compartment: number;
    times: string[];
    startDate: string;
    endDate: string;
}

interface DeviceStatus {
    isOnline: boolean;
    batteryLevel: number;
    lastSync: string;
}

interface Settings {
    emailNotifications: boolean;
    smsNotifications: boolean;
    reminderBefore: string;
    timeFormat: '12h' | '24h';
    emergencyContact: {
        name: string;
        phone: string;
        email: string;
    };
    user: {
        name: string;
        email: string;
    };
}

interface AppState {
    medicines: Medicine[];
    schedules: MedicineSchedule[];
    logs: HistoryLog[];
    device: DeviceStatus;
    settings: Settings;

    // Actions
    addMedicine: (medicine: Omit<Medicine, 'id'>) => void;
    updateScheduleStatus: (id: string, status: 'dispensed' | 'missed') => void;
    addLog: (log: Omit<HistoryLog, 'id'>) => void;
    updateDeviceStatus: (status: Partial<DeviceStatus>) => void;
    updateSettings: (settings: Partial<Settings>) => void;
    generateDailySchedules: () => void;
}

export const useMedicineStore = create<AppState>()(
    persist(
        (set, get) => ({
            medicines: [],
            schedules: [],
            logs: [],
            device: {
                isOnline: true,
                batteryLevel: 85,
                lastSync: new Date().toISOString(),
            },
            settings: {
                emailNotifications: true,
                smsNotifications: false,
                reminderBefore: '15',
                timeFormat: '12h',
                emergencyContact: {
                    name: '',
                    phone: '',
                    email: '',
                },
                user: {
                    name: '',
                    email: '',
                },
            },

            addMedicine: (medicine) => {
                const newMedicine = { ...medicine, id: crypto.randomUUID() };
                set((state) => ({
                    medicines: [...state.medicines, newMedicine],
                }));
                get().generateDailySchedules();
            },

            updateScheduleStatus: (id, status) => {
                set((state) => ({
                    schedules: state.schedules.map((s) =>
                        s.id === id ? { ...s, status } : s
                    ),
                }));
            },

            addLog: (log) => {
                const newLog = { ...log, id: crypto.randomUUID() };
                set((state) => ({
                    logs: [newLog, ...state.logs],
                }));
            },

            updateDeviceStatus: (status) => {
                set((state) => ({
                    device: { ...state.device, ...status },
                }));
            },

            updateSettings: (newSettings) => {
                set((state) => ({
                    settings: { ...state.settings, ...newSettings },
                }));
            },

            generateDailySchedules: () => {
                const { medicines } = get();
                // Simple logic: generate schedules for "today" based on medicines
                // In a real app, this would check dates and complex recurrence
                const todaySchedules: MedicineSchedule[] = [];

                medicines.forEach((med) => {
                    med.times.forEach((time) => {
                        // Create a deterministic ID for today's schedule to avoid duplicates on re-render
                        // Format: medId-date-time
                        const todayStr = new Date().toDateString();
                        const scheduleId = `${med.id}-${todayStr}-${time}`;

                        // Check if already exists (optional, depends on how often we call this)
                        // For now, let's just regenerate
                        todaySchedules.push({
                            id: scheduleId,
                            medicineName: med.name,
                            dosage: med.dosage,
                            time: time,
                            status: 'upcoming', // Default, should ideally check time
                            compartment: med.compartment
                        });
                    });
                });

                // Merge with existing schedules to preserve status if already dispensed
                set((state) => {
                    const existingMap = new Map(state.schedules.map(s => [s.id, s]));
                    const mergedSchedules = todaySchedules.map(newS => {
                        const existing = existingMap.get(newS.id);
                        return existing ? existing : newS;
                    });

                    // Sort by time
                    mergedSchedules.sort((a, b) => a.time.localeCompare(b.time));

                    return { schedules: mergedSchedules };
                });
            },
        }),
        {
            name: 'medicine-storage',
        }
    )
);
