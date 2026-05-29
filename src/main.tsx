import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { APP_VERSION } from './version';
import { DiagOverlay } from './components/DiagOverlay';
import { isDiagMode } from './diag';
import { getFirstLoadMs } from './ads';
import './styles.css';

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
