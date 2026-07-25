/**
 * lib/env.ts
 *
 * Startup environment variable validation.
 *
 * Every required env var is checked at module load time. If any variable is
 * absent (undefined) or empty (empty string), an error is thrown that names
 * the missing variable so the developer knows exactly what to fix.
 *
 * Requirements: 17.1, 17.2, 17.3, 17.4
 */

/**
 * All environment variables that must be present for the application to
 * function correctly. Exported so property tests can iterate over them.
 */
export const REQUIRED_ENV_VARS = [
  // Client-side Firebase config (NEXT_PUBLIC_*)
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
  // Server-only Firebase Admin SDK credentials
  'FIREBASE_ADMIN_PROJECT_ID',
  'FIREBASE_ADMIN_CLIENT_EMAIL',
  'FIREBASE_ADMIN_PRIVATE_KEY',
  // Session cookie signing secret
  'FIREBASE_SESSION_SECRET',
] as const;

export type RequiredEnvVar = (typeof REQUIRED_ENV_VARS)[number];

/**
 * Validates that all required environment variables are present and non-empty.
 *
 * Throws an error naming the first missing variable it encounters so that
 * misconfigured deployments fail fast with an actionable message.
 *
 * Call this once during application initialisation (e.g. at the top of
 * firebase-client.ts and firebase-admin.ts) rather than scattering individual
 * `process.env.X ?? throw` expressions across the codebase.
 */
export function validateEnv(): void {
  for (const key of REQUIRED_ENV_VARS) {
    const value = process.env[key];
    if (value === undefined || value === '') {
      throw new Error(`Missing required env var: ${key}`);
    }
  }
}

/**
 * Returns the value of the given environment variable, throwing with a
 * descriptive message if it is absent or empty.
 *
 * Useful for reading individual vars in a type-safe way after `validateEnv()`
 * has already confirmed they are all present.
 */
export function requireEnvVar(key: RequiredEnvVar): string {
  const value = process.env[key];
  if (value === undefined || value === '') {
    throw new Error(`Missing required env var: ${key}`);
  }
  return value;
}

// Run validation at module load time so that any server startup or
// import of this module immediately surfaces missing configuration.
validateEnv();
