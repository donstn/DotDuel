import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { shouldOfferAppUpdate, markAppUpdateDeclined } from './storage';

// Android only: Google Play's own "update available" dialog (flexible flow).
// The download runs in the background; the install is finished only while the
// app is in the background or at the next launch, never mid-game. Does nothing
// on web, on iOS, or for installs that did not come from Google Play.
export function startAppUpdateCheck(): void {
  if (Capacitor.getPlatform() !== 'android') return;
  void run().catch((e) => console.warn('app update check failed:', e));
}

async function run(): Promise<void> {
  const { AppUpdate, AppUpdateAvailability, AppUpdateResultCode, FlexibleUpdateInstallStatus } =
    await import('@capawesome/capacitor-app-update');

  let downloaded = false;
  const finish = () => {
    if (!downloaded) return;
    downloaded = false;
    void AppUpdate.completeFlexibleUpdate().catch((e) => console.warn('app update install failed:', e));
  };

  const info = await AppUpdate.getAppUpdateInfo();
  if (info.installStatus === FlexibleUpdateInstallStatus.DOWNLOADED) {
    // Downloaded during an earlier session: install now, before any game starts.
    downloaded = true;
    finish();
    return;
  }

  await AppUpdate.addListener('onFlexibleUpdateStateChange', (state) => {
    if (state.installStatus === FlexibleUpdateInstallStatus.DOWNLOADED) downloaded = true;
  });
  await CapacitorApp.addListener('appStateChange', ({ isActive }) => {
    if (!isActive) finish();
  });

  if (info.updateAvailability !== AppUpdateAvailability.UPDATE_AVAILABLE) return;
  if (!info.flexibleUpdateAllowed || !shouldOfferAppUpdate()) return;

  const result = await AppUpdate.startFlexibleUpdate();
  if (result.code === AppUpdateResultCode.CANCELED) markAppUpdateDeclined();
}
