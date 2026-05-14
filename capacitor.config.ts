import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ch.mana.agenthub',
  appName: 'Mana Agent Hub',
  webDir: 'public',
  server: {
    url: 'https://manashopai.onrender.com/dashboard.html',
    androidScheme: 'https',
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
