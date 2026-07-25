/**
 * app/api/session/logout/route.ts
 *
 * POST /api/session/logout
 *
 * Clears the session cookie by setting it to an expired value (Max-Age=0).
 *
 * Requirements: 8.1, 18.2
 */

export const runtime = 'nodejs';

export async function POST(): Promise<Response> {
  const cookieHeader = 'session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0';

  return new Response(JSON.stringify({ status: 'success' }), {
    status: 200,
    headers: {
      'Set-Cookie': cookieHeader,
      'Content-Type': 'application/json',
    },
  });
}
