/**
 * lib/users.ts
 *
 * User profile helpers — stores role in Realtime Database at /users/{uid}
 * Server-only (uses Admin SDK).
 */

import { adminDb } from '@/lib/firebase-admin';

export type UserRole = 'admin' | 'user';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: number;
}

/** Save a new user profile with role to /users/{uid} */
export async function createUserProfile(
  uid: string,
  email: string,
  displayName: string,
  role: UserRole,
): Promise<UserProfile> {
  const profile: UserProfile = {
    uid,
    email,
    displayName,
    role,
    createdAt: Date.now(),
  };
  await adminDb.ref(`users/${uid}`).set(profile);
  return profile;
}

/** Get a user's role from /users/{uid} */
export async function getUserRole(uid: string): Promise<UserRole> {
  const snapshot = await adminDb.ref(`users/${uid}/role`).once('value');
  // Default to 'user' if no profile exists (e.g. pre-existing accounts)
  return (snapshot.val() as UserRole) ?? 'user';
}
