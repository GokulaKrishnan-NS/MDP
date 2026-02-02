export type MedicineStatus = 'upcoming' | 'dispensed' | 'missed';

export interface Medicine {
  id: string;
  name: string;
  dosage: string;
  compartment: number;
  times: string[]; // Array of times like ["08:00", "14:00", "20:00"]
  startDate: string;
  endDate: string;
}

export interface MedicineSchedule {
  id: string;
  medicineId?: string; // Optional now as we generate IDs
  medicineName: string;
  dosage: string;
  compartment: number;
  time: string;
  status: MedicineStatus;
  date?: string;
}

export interface HistoryLog {
  id: string;
  date: string;
  time: string;
  medicineName: string;
  dosage: string;
  status: 'dispensed' | 'missed';
}

export interface DeviceInfo {
  isOnline: boolean;
  lastSyncTime: string;
  batteryLevel: number;
}
