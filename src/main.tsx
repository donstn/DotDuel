import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { APP_VERSION } from './version';
import './styles.css';

console.log(`%cDotDuel ${APP_VERSION} loaded`, 'color:#6fcf8a;font-weight:bold;font-size:13px');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
