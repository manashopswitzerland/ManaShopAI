import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ch.mana.agenthub',
  appName: 'Mana Agent Hub',
  webDir: 'public',
  server: {
    // Live-reload during development — APK loads directly from your running server
    url: 'http://192.168.18.158:4000/dashboard.html',
    cleartext: true,
    androidScheme: 'http',
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: '#f5f5f7',
    },
  },
};

export default config;
