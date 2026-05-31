import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { APP_VERSION } from './version';
import { DiagOverlay } from './components/DiagOverlay';
import { isDiagMode } from './diag';
import { getFirstLoadMs } from './ads';
import { bootSession } from './firebase';
import './styles.css';

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
