// IoT state shared across backend and polled by ESP32
// This module is intentionally minimal and entirely isolated from existing business logic.

export interface IoTState {
    dispenseRequested: boolean;
    requestedAt: number | null; // timestamp in ms
    confirmed: boolean;
    lastSeen: number | null;    // timestamp when ESP32 last polled
}

// Singleton object exported for mutable access
export const iotState: IoTState = {
    dispenseRequested: false,
    requestedAt: null,
    confirmed: false,
    lastSeen: null,
};
