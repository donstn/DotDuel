import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dotduel.app',
  appName: 'DotDuel',
  webDir: 'dist',
  // Same colour as the splash: no white frame before the first paint.
  backgroundColor: '#0C1D14'
};

export default config;
