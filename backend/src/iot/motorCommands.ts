export type MotorCommand = `TRAY_${number}_ROTATE`;

/**
 * Dispatches a motor command to the IoT hardware layer.
 * Currently a stub — replace body with real hardware communication.
 */
export async function dispatchMotorCommand(command: MotorCommand): Promise<void> {
    console.log(`[IoT] Motor command → ${command}`);
    // Future: require('../../iot-service').send(command)
}
