/**
 * app/api/session/route.ts
 *
 * POST /api/session
 *
 * Accepts a Firebase ID token, exchanges it for an HttpOnly session cookie,
 * and returns the user's role so the client can redirect appropriately.
 */

import { adminAuth } from '@/lib/firebase-admin';
import { getUserRole } from '@/lib/users';

export const runtime = 'nodejs';

const SESSION_EXPIRES_IN = 60 * 60 * 24 * 5 * 1000; // 5 days

export async function POST(request: Request): Promise<Response> {
  try {
    const { idToken } = await request.json();

    // Verify token to get uid, then look up the user's role
    const decoded = await adminAuth.verifyIdToken(idToken);
    const role = await getUserRole(decoded.uid);

    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_EXPIRES_IN,
    });

    const maxAgeSeconds = SESSION_EXPIRES_IN / 1000;
    const cookieHeader = `session=${sessionCookie}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAgeSeconds}`;

    return new Response(JSON.stringify({ status: 'success', role }), {
      status: 200,
      headers: {
        'Set-Cookie': cookieHeader,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('[POST /api/session]', error);
    return new Response(JSON.stringify({ message: 'An internal error occurred' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
