export class MockIotService {
    private static instance: MockIotService;

    private constructor() { }

    public static getInstance(): MockIotService {
        if (!MockIotService.instance) {
            MockIotService.instance = new MockIotService();
        }
        return MockIotService.instance;
    }

    // Simulate dispensing with delay
    async dispense(compartmentId: number): Promise<{ success: boolean; message: string }> {
        return new Promise((resolve) => {
            setTimeout(() => {
                // 90% success rate simulation
                const isSuccess = Math.random() > 0.1;
                if (isSuccess) {
                    resolve({ success: true, message: "Medicine dispensed successfully." });
                } else {
                    resolve({ success: false, message: "Dispensing failed. Please check the device." });
                }
            }, 2000);
        });
    }

    async checkStatus(): Promise<{ isOnline: boolean; batteryLevel: number }> {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    isOnline: true,
                    batteryLevel: Math.floor(Math.random() * (100 - 20) + 20), // Random 20-100%
                });
            }, 1500);
        });
    }
}

export const iotService = MockIotService.getInstance();
