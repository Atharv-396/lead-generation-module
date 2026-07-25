/**
 * lib/firebase-client.ts
 *
 * Initialises the Firebase client SDK for use in browser/client components.
 *
 * Configuration is read directly from the NEXT_PUBLIC_FIREBASE_* environment
 * variables, which Next.js statically replaces at build time. We do NOT call
 * requireEnvVar() / validateEnv() here because lib/env.ts runs validateEnv()
 * at module load time — that function also validates server-only vars which
 * are not available in the browser (or in test environments).
 *
 * The getApps() guard prevents re-initialisation during Next.js hot reloads.
 *
 * Requirements: 17.1
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Guard against re-initialisation in hot-reload environments.
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
