import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mindmood.app',
  appName: 'Mind Mood AI',
  webDir: 'dist',
  server: {
    url: 'https://mind-shine-guide-main.vercel.app',
    cleartext: true
  }
};

export default config;
