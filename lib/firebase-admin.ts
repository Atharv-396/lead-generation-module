/**
 * lib/firebase-admin.ts
 *
 * Firebase Admin SDK initialisation (server-only).
 * Uses Realtime Database instead of Firestore.
 *
 * Requirements: 17.2, 18.2
 */

import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getDatabase } from 'firebase-admin/database';

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!projectId || !clientEmail || !privateKey) {
  throw new Error(
    'Missing Firebase Admin credentials. Ensure FIREBASE_ADMIN_PROJECT_ID, ' +
      'FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY are set.'
  );
}

const databaseURL = `https://${projectId}-default-rtdb.firebaseio.com`;

if (!getApps().length) {
  initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    databaseURL,
  });
}

/** Firebase Admin Auth instance — use for session cookie operations. */
export const adminAuth = getAuth();

/** Firebase Admin Realtime Database instance — use for server-side data access. */
export const adminDb = getDatabase();
