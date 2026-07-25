'use client';
import { useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase-client';

const googleProvider = new GoogleAuthProvider();

export type UserRole = 'admin' | 'user';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return unsub;
  }, []);

  /** Sign in with email/password — redirect based on role */
  async function signIn(email: string, password: string) {
    setIsLoading(true);
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const role = await createSession(credential.user);
      redirectByRole(role);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Authentication failed';
      throw new Error(mapFirebaseError(msg));
    } finally {
      setIsLoading(false);
    }
  }

  /** Sign in with Google — redirect based on role */
  async function signInWithGoogle() {
    setIsGoogleLoading(true);
    try {
      const credential = await signInWithPopup(auth, googleProvider);
      const role = await createSession(credential.user);
      redirectByRole(role);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Authentication failed';
      throw new Error(mapFirebaseError(msg));
    } finally {
      setIsGoogleLoading(false);
    }
  }

  async function signOut() {
    await fetch('/api/session/logout', { method: 'POST' });
    await firebaseSignOut(auth);
    router.push('/login');
  }

  function redirectByRole(role: UserRole) {
    if (role === 'admin') {
      router.push('/admin');
    } else {
      router.push('/'); // normal users go to landing page / lead form
    }
  }

  return { user, isLoading, isGoogleLoading, signIn, signInWithGoogle, signOut };
}

/** Creates a server-side session cookie and returns the user's role */
async function createSession(user: User): Promise<UserRole> {
  const idToken = await user.getIdToken();
  const res = await fetch('/api/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  if (!res.ok) throw new Error('Failed to create session');
  const data = await res.json();
  return (data.role as UserRole) ?? 'user';
}

function mapFirebaseError(msg: string): string {
  if (
    msg.includes('wrong-password') ||
    msg.includes('user-not-found') ||
    msg.includes('invalid-credential')
  ) {
    return 'Incorrect email or password.';
  }
  if (msg.includes('popup-closed-by-user') || msg.includes('cancelled-popup-request')) {
    return 'Sign-in cancelled.';
  }
  if (msg.includes('popup-blocked')) {
    return 'Popup was blocked. Please allow popups for this site.';
  }
  if (msg.includes('network')) return 'Network error. Please check your connection.';
  return msg;
}
