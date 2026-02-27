import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.example.medreminder',
    appName: 'Smart Medicine Reminder',
    // Vite builds to the 'dist' folder. We must route Capacitor to serve these static assets.
    webDir: 'build'
};

export default config;
