/**
 * IoT Service — Motor Command Handler (Stub)
 *
 * This is the hardware integration layer.
 * Currently a stub that logs commands.
 *
 * To integrate real hardware:
 *   - Replace console.log with serial/MQTT/TCP emit
 *   - Tray → Motor mapping: trayId N → command "TRAY_N_ROTATE"
 */

export type MotorCommand = `TRAY_${number}_ROTATE`;

export async function dispatchMotorCommand(command: MotorCommand): Promise<void> {
    console.log(`[IoT-Service] Motor command dispatched: ${command}`);
    // TODO: Replace with actual hardware communication
    // Example (serial):
    //   serialPort.write(command + '\n');
    // Example (MQTT):
    //   mqttClient.publish('dispenser/commands', command);
}
