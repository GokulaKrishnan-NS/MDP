# IoT Service & ESP32 Integration

This folder contains supporting materials for the ESP32 device that will
communicate with the backend to execute physical dispense commands. It is
separate from the frontend and does **not** modify any existing API behavior.

## Overview

- The backend exposes two new endpoints under `/api/iot/` used exclusively by
the ESP32.
  - `GET /api/iot/command` -- indicates whether a dispense request is pending.
  - `POST /api/iot/confirm` -- acknowledgement sent after the servo has moved.
- An in‑memory `iotState` module lives in the backend; it is updated when
  `POST /api/dispense` is called by the existing UI logic.
- The ESP32 polls the command endpoint every 5 seconds. If it sees
  `"dispense":true` it rotates a servo (GPIO18) and then posts a confirmation.
- The state auto‑resets if the ESP32 never confirms within 2 minutes.

Frontend and existing features remain untouched.

## ESP32 Firmware

Firmware source is provided in `esp32/firmware.ino`. It uses the
Arduino/ESP32 core libraries (`WiFi.h`, `HTTPClient.h`, `Servo.h`) and is
published here for convenience.

### Flash Instructions

1. Install the [ESP32 Arduino boards][esp32-boards] in the Arduino IDE or
   use PlatformIO.
2. Open `esp32/firmware.ino`.
3. Update `WIFI_SSID`, `WIFI_PASSWORD` and `SERVER_BASE` constants to match
   your network and backend host (e.g. `http://192.168.1.100:3000/api/iot`).
4. Connect an ESP32 development board and select the correct board/port.
5. Upload the sketch.
6. Power a small hobby servo from a stable 5 V supply; connect the signal line
   to GPIO18 on the ESP32.

> **Note:** the servo movement is a simple 0→90°→0° sequence with an 800 ms
> hold at 90°. Adjust `SERVO_MOVE_DELAY_MS` in the sketch if your mechanism
> requires a different timing.

### Behavior Details

- **Polling interval:** every 5 seconds (`delay(5000)` in `loop()`).
- **Wi-Fi:** reconnect logic attempts every loop if connection is lost.
- **Duplicate prevention:**
  - Backend state only returns `dispense:true` once per user action.
  - Firmware tracks a local `alreadyHandled` flag so that if the
    command remains `true` (e.g. network failure while confirming) the
    servo will not rotate again until the backend flips the flag back to
    `false` and a new request is seen.
  - A short 1 s debounce delay follows successful rotation.
- **Error handling:** if the server is unreachable or Wi-Fi disconnects, the
  device simply retries on the next loop iteration.

## Backend Integration Points

The backend changes are contained entirely in `backend/src`:

- `iotState.ts` – mutable singleton state object.
- `routes/iotRoutes.ts` – new Express router for the two endpoints.
- `controllers/DispenseController.ts` – small hook added after a successful
  dispense to flag the IoT state.
- `app.ts` – registers the new `/api/iot` router.

The existing dispense, tray and hospital logic is unaffected; no existing
responses were altered and no route names changed.

[esp32-boards]: https://github.com/espressif/arduino-esp32#installation
