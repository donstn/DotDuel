import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dotduel.app',
  appName: 'DotDuel',
  webDir: 'dist',
  // Same colour as the splash: no white frame before the first paint.
  backgroundColor: '#0C1D14',
  plugins: {
    // Every theme is dark, so system-bar icons must be light even when the
    // phone is in light mode (DEFAULT follows the phone and drew dark icons).
    SystemBars: { style: 'DARK' }
  }
};

export default config;
