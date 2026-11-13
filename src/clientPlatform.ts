import { Capacitor } from '@capacitor/core';

// Where this copy of the game is running. Shared by Analytics (app_platform user
// property) and the signed-in account record (profiles.last_platform).
export type ClientPlatform = 'android' | 'ios' | 'web-installed' | 'web';

export function detectPlatform(): ClientPlatform {
  if (Capacitor.isNativePlatform()) {
    return Capacitor.getPlatform() === 'ios' ? 'ios' : 'android';
  }
  try {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as { standalone?: boolean }).standalone === true;
    return standalone ? 'web-installed' : 'web';
  } catch {
    return 'web';
  }
}
