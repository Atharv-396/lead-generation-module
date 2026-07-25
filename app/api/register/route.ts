/**
 * POST /api/register
 *
 * Creates a new Firebase Auth user and saves their role to the Realtime DB.
 * Returns the created user's uid, email, displayName, and role.
 */

import { adminAuth } from '@/lib/firebase-admin';
import { createUserProfile, type UserRole } from '@/lib/users';
import { z } from 'zod';

export const runtime = 'nodejs';

const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  displayName: z.string().min(2, 'Name must be at least 2 characters').max(80),
  role: z.enum(['admin', 'user'], {
    error: 'Role must be admin or user',
  }),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return Response.json(
        { field: issue.path[0], message: issue.message },
        { status: 400 },
      );
    }

    const { email, password, displayName, role } = parsed.data;

    // Create the user in Firebase Auth
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName,
    });

    // Save profile + role to Realtime DB
    const profile = await createUserProfile(
      userRecord.uid,
      email,
      displayName,
      role as UserRole,
    );

    return Response.json(
      { uid: profile.uid, email: profile.email, displayName: profile.displayName, role: profile.role },
      { status: 201 },
    );
  } catch (error) {
    console.error('[POST /api/register]', error);

    // Surface Firebase Auth specific errors
    if (error instanceof Error && error.message.includes('EMAIL_EXISTS')) {
      return Response.json({ field: 'email', message: 'An account with this email already exists.' }, { status: 409 });
    }
    if (error instanceof Error && (error as { code?: string }).code === 'auth/email-already-exists') {
      return Response.json({ field: 'email', message: 'An account with this email already exists.' }, { status: 409 });
    }

    return Response.json({ message: 'An internal error occurred' }, { status: 500 });
  }
}
