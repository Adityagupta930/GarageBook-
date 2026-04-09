import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.porwal.autoparts',
  appName: 'Porwal Autoparts',
  webDir: 'out',
  // Deployed Vercel URL use karo — API routes wahan se serve hongi
  // Isse static export mein API routes ki zaroorat nahi
  server: {
    url: 'https://garage-book-app.vercel.app', // ← apna actual Vercel URL yahan daalo
    cleartext: false,
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    },
  },
  plugins: {
    StatusBar: {
      style: 'Dark',
      backgroundColor: '#0d1117',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#0d1117',
      showSpinner: false,
    },
  },
};

export default config;
