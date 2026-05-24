import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: 'AIzaSyBCg_LiK9S_jZ3CL0-H0-lpyldk5--RZHE',
  authDomain: 'dotduel.firebaseapp.com',
  databaseURL: 'https://dotduel-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'dotduel',
  storageBucket: 'dotduel.firebasestorage.app',
  messagingSenderId: '153943407637',
  appId: '1:153943407637:web:b949ade37f04170e2aa21c',
  measurementId: 'G-9H8DXGC34Z',
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);

// GDPR / ePrivacy: Analytics is NEVER initialised on import. It only
// starts after the user explicitly accepts via the consent banner.
// See src/consent.ts.
let analyticsStarted = false;

export async function enableAnalyticsIfSupported(): Promise<void> {
  if (analyticsStarted) return;
  if (!import.meta.env.PROD) return;
  try {
    const ok = await isSupported();
    if (!ok) return;
    getAnalytics(app);
    analyticsStarted = true;
  } catch (e) {
    console.warn('enableAnalyticsIfSupported failed:', e);
  }
}
