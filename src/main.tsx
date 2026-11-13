import React from 'react';
import ReactDOM from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import App from './App';
import { LanguageProvider } from './i18n';
import { APP_VERSION } from './version';
import { DiagOverlay } from './components/DiagOverlay';
import { ErrorBoundary } from './components/ErrorBoundary';
import { NativeAdDivider } from './components/NativeAdDivider';
import { isDiagMode } from './diag';
import { ADS_ENABLED, getFirstLoadMs } from './ads';
import { bootSession } from './telemetry';
import { startFitText } from './fitText';
import { startDialogFocus } from './dialogFocus';
import { startServiceWorker } from './swUpdate';
import { startClientRecord } from './cloud/clientRecord';
import './styles.css';

// Android system font size, handed over by FontScalePlugin (the WebView's own
// text zoom is off), applied as the root size so every rem grows with it.
const nativeFontScale = (
  window as { DotDuelNative?: { fontScale?: () => number } }
).DotDuelNative?.fontScale?.();
if (nativeFontScale && nativeFontScale !== 1) {
  document.documentElement.style.fontSize = `${nativeFontScale * 100}%`;
}
// How much the player enlarged text (browser or system setting), for layouts
// built from fixed-size art: --text-scale grows them, and data-text-large lets
// labels wrap instead of fitting one line.
{
  const scale = parseFloat(getComputedStyle(document.documentElement).fontSize) / 16 || 1;
  document.documentElement.style.setProperty('--text-scale', String(Math.max(1, scale)));
  if (scale >= 1.15) document.documentElement.dataset.textLarge = '';
}

// Service worker: register on WEB only (updates applied at a safe moment, see
// swUpdate.ts). In the
// native Capacitor app, assets are bundled in the APK and a SW only causes
// stale-asset bugs (serving a previous build's cache over the WebView), so we
// skip registration AND tear down any SW/caches a prior build may have left.
if (Capacitor.isNativePlatform()) {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .getRegistrations()
      .then((regs) => regs.forEach((r) => r.unregister()))
      .catch(() => {});
  }
  if (typeof caches !== 'undefined') {
    caches.keys().then((keys) => keys.forEach((k) => caches.delete(k))).catch(() => {});
  }
} else {
  startServiceWorker();
}

// Snapshot session-boot state for analytics BEFORE getFirstLoadMs writes
// the firstLoad key — otherwise first_visit collapses into
// session_start_returning. Safe to call before consent; the snapshot is
// just held in memory until enableAnalyticsIfSupported fires the event.
bootSession();

// Establish the per-device first-load timestamp before any UI mounts.
// This drives the early-adopter grandfather rule when ads are eventually
// enabled — anyone whose first ever visit was before that flip date
// stays exempt from ads. See src/ads.ts.
void getFirstLoadMs();

console.log(`%cDotDuel ${APP_VERSION} loaded`, 'color:#6fcf8a;font-weight:bold;font-size:13px');

startFitText();
startDialogFocus();
startClientRecord();

// Hidden admin dashboard (dotduel.com/#admin). Lazy so players never download
// it; the data itself is gated server-side by admin_stats().
const AdminPage = React.lazy(() => import('./admin/AdminPage'));
const isAdminRoute = window.location.hash === '#admin';

ReactDOM.createRoot(document.getElementById('root')!).render(
  isAdminRoute ? (
    <React.Suspense fallback={null}>
      <AdminPage />
    </React.Suspense>
  ) : (
    <React.StrictMode>
      <LanguageProvider>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
        {Capacitor.isNativePlatform() && ADS_ENABLED && <NativeAdDivider />}
        {isDiagMode() && <DiagOverlay />}
      </LanguageProvider>
    </React.StrictMode>
  ),
);
