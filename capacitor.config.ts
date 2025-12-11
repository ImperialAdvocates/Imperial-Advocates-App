import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.imperialadvocates.portal',
  appName: 'Imperial Advocates',
  webDir: 'out',
  bundledWebRuntime: false,
  server: {
    url: 'https://imperial-advocates-app-qt8i-i5ot0wbix.vercel.app',
    cleartext: true,
  },
};

export default config;