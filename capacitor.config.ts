import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ttmlstudio.app',
  appName: 'TTML Subtitle Studio',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    backgroundColor: '#020617',
    appendUserAgent: 'TTMLStudio-Android',
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#020617',
      overlaysWebView: false,
    },
  },
};

export default config;
