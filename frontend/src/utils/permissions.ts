/**
 * permissions.ts
 *
 * Bootstraps notification permissions on Android/iOS.
 * Location permission removed — geolocation feature removed.
 */

import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

export interface PermissionsState {
    notifications: 'granted' | 'denied' | 'prompt' | 'unavailable';
}

export async function bootstrapPermissions(): Promise<PermissionsState> {
    const state: PermissionsState = { notifications: 'unavailable' };

    if (!Capacitor.isNativePlatform()) {
        state.notifications = 'prompt';
        return state;
    }

    // ── Local Notifications ───────────────────────────────────────────────────
    try {
        const notifStatus = await LocalNotifications.checkPermissions();
        if (notifStatus.display === 'prompt' || notifStatus.display === 'prompt-with-rationale') {
            const requested = await LocalNotifications.requestPermissions();
            state.notifications = requested.display as PermissionsState['notifications'];
        } else {
            state.notifications = notifStatus.display as PermissionsState['notifications'];
        }
    } catch {
        state.notifications = 'unavailable';
    }

    console.log('[Permissions]', state);
    return state;
}
