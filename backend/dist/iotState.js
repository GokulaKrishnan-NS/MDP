"use strict";
// IoT state shared across backend and polled by ESP32
// This module is intentionally minimal and entirely isolated from existing business logic.
Object.defineProperty(exports, "__esModule", { value: true });
exports.iotState = void 0;
// Singleton object exported for mutable access
exports.iotState = {
    dispenseRequested: false,
    requestedAt: null,
    confirmed: false,
    lastSeen: null,
};
