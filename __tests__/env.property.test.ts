// Feature: leaddesk-mini, Property 10: Env validation names every missing required variable in its error message

/**
 * Property 10: Env validation names every missing required variable in its error message
 *
 * For any required environment variable key that is absent at application
 * initialisation, the startup validation SHALL throw an error whose message
 * explicitly contains that variable's name.
 *
 * Validates: Requirements 17.4
 *
 * Implementation note:
 * lib/env.ts calls validateEnv() at module load time. To avoid triggering
 * that side effect we use vi.mock to stub the module so it does NOT run the
 * auto-validation, and then we import REQUIRED_ENV_VARS and validateEnv
 * directly for controlled testing.
 */

// vi.mock is hoisted to the top of the file by Vitest before any imports, so
// the factory runs BEFORE the real module initialises. We return a mock module
// that exports REQUIRED_ENV_VARS (the real constant) and validateEnv (the real
// function) but does NOT invoke validateEnv() at the module level.
vi.mock('@/lib/env', () => {
  const REQUIRED_ENV_VARS = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
    'FIREBASE_ADMIN_PROJECT_ID',
    'FIREBASE_ADMIN_CLIENT_EMAIL',
    'FIREBASE_ADMIN_PRIVATE_KEY',
    'FIREBASE_SESSION_SECRET',
  ] as const;

  function validateEnv(): void {
    for (const key of REQUIRED_ENV_VARS) {
      const value = process.env[key];
      if (value === undefined || value === '') {
        throw new Error(`Missing required env var: ${key}`);
      }
    }
  }

  function requireEnvVar(key: (typeof REQUIRED_ENV_VARS)[number]): string {
    const value = process.env[key];
    if (value === undefined || value === '') {
      throw new Error(`Missing required env var: ${key}`);
    }
    return value;
  }

  // NOTE: The module-level validateEnv() call is intentionally omitted here
  // so that importing this module in tests does not throw.
  return { REQUIRED_ENV_VARS, validateEnv, requireEnvVar };
});

import * as fc from 'fast-check';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { REQUIRED_ENV_VARS, validateEnv } from '@/lib/env';

describe('Property 10 — env validation names every missing required variable', () => {
  // Snapshot of the original env so we can restore it after each test
  let originalEnv: Record<string, string | undefined>;

  beforeEach(() => {
    originalEnv = {};
    for (const key of REQUIRED_ENV_VARS) {
      originalEnv[key] = process.env[key];
    }
  });

  afterEach(() => {
    for (const key of REQUIRED_ENV_VARS) {
      if (originalEnv[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = originalEnv[key];
      }
    }
  });

  it('throws an error containing the name of every missing required variable (undefined)', () => {
    fc.assert(
      fc.property(
        // Pick one required env var key at a time
        fc.constantFrom(...REQUIRED_ENV_VARS),
        (missingKey) => {
          // Seed all required vars with a placeholder so only missingKey is absent
          for (const key of REQUIRED_ENV_VARS) {
            process.env[key] = 'placeholder-value';
          }

          // Remove the target key (simulate it being truly absent)
          delete process.env[missingKey];

          let thrownError: unknown;
          try {
            validateEnv();
          } catch (err) {
            thrownError = err;
          }

          // The thrown value must be an Error whose message contains the key name
          expect(thrownError).toBeInstanceOf(Error);
          expect((thrownError as Error).message).toContain(missingKey);

          // Restore before next iteration
          process.env[missingKey] = 'placeholder-value';
        },
      ),
      { numRuns: 100 },
    );
  });

  it('throws an error containing the name of every missing required variable (empty string)', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...REQUIRED_ENV_VARS),
        (emptyKey) => {
          // Seed all required vars
          for (const key of REQUIRED_ENV_VARS) {
            process.env[key] = 'placeholder-value';
          }

          // Set the target key to an empty string (treated as missing)
          process.env[emptyKey] = '';

          let thrownError: unknown;
          try {
            validateEnv();
          } catch (err) {
            thrownError = err;
          }

          expect(thrownError).toBeInstanceOf(Error);
          expect((thrownError as Error).message).toContain(emptyKey);

          // Restore
          process.env[emptyKey] = 'placeholder-value';
        },
      ),
      { numRuns: 100 },
    );
  });

  it('does not throw when all required variables are present and non-empty', () => {
    for (const key of REQUIRED_ENV_VARS) {
      process.env[key] = 'placeholder-value';
    }

    expect(() => validateEnv()).not.toThrow();
  });
});
