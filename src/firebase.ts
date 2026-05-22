import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: 'AIzaSyBCg_LiK9S_jZ3CL0-H0-lpyldk5--RZHE',
  authDomain: 'dotduel.firebaseapp.com',
  projectId: 'dotduel',
  storageBucket: 'dotduel.firebasestorage.app',
  messagingSenderId: '153943407637',
  appId: '1:153943407637:web:b949ade37f04170e2aa21c',
  measurementId: 'G-9H8DXGC34Z',
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

if (import.meta.env.PROD) {
  isSupported().then((ok) => {
    if (ok) getAnalytics(app);
  });
}
