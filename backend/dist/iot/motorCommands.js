"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dispatchMotorCommand = dispatchMotorCommand;
/**
 * Dispatches a motor command to the IoT hardware layer.
 * Currently a stub — replace body with real hardware communication.
 */
async function dispatchMotorCommand(command) {
    console.log(`[IoT] Motor command → ${command}`);
    // Future: require('../../iot-service').send(command)
}
