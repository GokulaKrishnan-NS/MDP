
import { LocalNotifications } from '@capacitor/local-notifications';
import { Medicine } from '@/lib/types';

export const NotificationService = {
    async requestPermissions() {
        try {
            const result = await LocalNotifications.requestPermissions();
            return result.display === 'granted';
        } catch (e) {
            console.error("Error requesting notification permissions", e);
            return false;
        }
    },

    async scheduleReminder(medicine: Medicine, time: string) {
        try {
            // Parse time (HH:MM)
            const [hours, minutes] = time.split(':').map(Number);
            const now = new Date();
            const scheduledTime = new Date();
            scheduledTime.setHours(hours, minutes, 0, 0);

            // If time has passed for today, schedule for tomorrow
            if (scheduledTime <= now) {
                scheduledTime.setDate(scheduledTime.getDate() + 1);
            }

            // Create a unique ID based on medicine ID and time
            // Simple hash or just a random number if we don't need to cancel specifically by ID later easily without storage
            // For this mock, we'll try to generate a stable ID
            // Note: This ID generation is weak but sufficient for mock if medicine.id is numeric. 
            // If medicine ID is UUID, we need a better mapping.
            // Let's use random for now since we are mocking.
            const id = Math.floor(Math.random() * 1000000);

            await LocalNotifications.schedule({
                notifications: [
                    {
                        title: `Time to take ${medicine.name}`,
                        body: `Dosage: ${medicine.dosage}`,
                        id: id,
                        schedule: { at: scheduledTime, allowWhileIdle: true },
                        sound: undefined,
                        attachments: undefined,
                        actionTypeId: "",
                        extra: {
                            medicineId: medicine.id
                        }
                    }
                ]
            });
            console.log(`Scheduled notification for ${medicine.name} at ${scheduledTime}`);
            return true;
        } catch (error) {
            console.error('Error scheduling notification', error);
            return false;
        }
    }
};
