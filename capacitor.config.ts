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
    SystemBars: { style: 'DARK' },
    // Streak reminder (src/reminders.ts): white status-bar icon + accent tint.
    LocalNotifications: { smallIcon: 'ic_stat_dotduel', iconColor: '#7BDB95' }
  }
};

export default config;
