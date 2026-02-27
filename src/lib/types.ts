export type DispenseStatus = 'taken' | 'missed' | 'late' | 'blocked' | 'scheduled';

export interface Medicine {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  total_count: number;
  remaining_count: number;
  start_date: string;
}

export interface MedicineSchedule {
  id: string;
  medication_id: string;
  scheduled_time: string;
  // Included fields for UI mapping (often joined in backend response)
  medicineName?: string;
  dosage?: string;
  status?: DispenseStatus;
}

export interface HistoryLog {
  id: string;
  medication_id: string;
  scheduled_time: string;
  dispensed_at: string;
  status: DispenseStatus;
  message?: string;
  // For UI mapping
  medicineName?: string;
  dosage?: string;
}

export interface DeviceInfo {
  isOnline: boolean;
  lastSyncTime: string;
  batteryLevel: number;
}
