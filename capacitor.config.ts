import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ttml.subtitle.studio',
  appName: 'TTML Subtitle Studio',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
