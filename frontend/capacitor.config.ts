import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.medidispense.app',
  appName: 'MediDispense',
  webDir: 'dist',
  // ── Development: comment this block out before building a production APK ──
  // server: {
  //   url: 'http://YOUR_LAN_IP:5173',   // e.g. http://192.168.1.10:5173
  //   cleartext: true,
  // },
  android: {
    allowMixedContent: true,
  },
};

export default config;

