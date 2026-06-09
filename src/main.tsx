import React from 'react';
import ReactDOM from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import { APP_VERSION } from './version';
import { DiagOverlay } from './components/DiagOverlay';
import { isDiagMode } from './diag';
import { getFirstLoadMs } from './ads';
import { bootSession } from './telemetry';
import './styles.css';

// Service worker: register on WEB only (auto-update for installed PWAs). In the
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
  registerSW({ immediate: true });
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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    {isDiagMode() && <DiagOverlay />}
  </React.StrictMode>
);
