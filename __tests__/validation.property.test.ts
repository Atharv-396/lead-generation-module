// Feature: leaddesk-mini, Property 1: Name bounds
// Feature: leaddesk-mini, Property 2: Email pattern
// Feature: leaddesk-mini, Property 3: Budget enum
// Feature: leaddesk-mini, Property 4: Message bounds
// Feature: leaddesk-mini, Property 5: Status enum
// Feature: leaddesk-mini, Property 9: All errors reported simultaneously

/**
 * Property tests for Zod validation schemas (`lib/schemas.ts`).
 *
 * Each property uses fast-check with { numRuns: 100 } to verify
 * that the schemas accept valid inputs and reject invalid ones across
 * a large sample of generated values.
 *
 * vi.mock('@/lib/env') is hoisted before any import so that importing
 * lib/schemas.ts (which transitively imports lib/env.ts) does not trigger
 * the module-level validateEnv() call that would throw in a test environment.
 *
 * Note on fast-check v4 API:
 *   - Use fc.string({ minLength, maxLength }) instead of fc.stringOf(fc.char(), ...)
 *   - fc.char() does not exist in v4; use fc.string({ minLength: 1, maxLength: 1 })
 *     or constrain via fc.string({ minLength, maxLength })
 *
 * Note on fc.emailAddress() vs Zod v4:
 *   - fast-check's fc.emailAddress() follows RFC 5321 which allows many special
 *     characters in the local-part (e.g. !,{,},~) that Zod v4 does not accept.
 *   - For the "valid email" case we therefore build emails from safe alphanumeric
 *     components that Zod accepts.
 *   - For the "invalid email" case we use strings that lack '@', which Zod always
 *     rejects regardless of version.
 */

vi.mock('@/lib/env', () => ({
  validateEnv: () => {},
  requireEnvVar: (_key: string) => 'test-value',
  REQUIRED_ENV_VARS: [],
}));

import * as fc from 'fast-check';
import { describe, it, expect } from 'vitest';
import { createLeadSchema, updateLeadSchema } from '@/lib/schemas';
import { BUDGET_OPTIONS } from '@/types/lead';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a fully-valid CreateLead payload, then override specific fields.
 * Used to isolate individual field validation while keeping the other fields
 * valid (so we only get errors for the field under test).
 */
function validCreatePayload(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    name: 'Alice Example',
    email: 'alice@example.com',
    budget: BUDGET_OPTIONS[0],
    message: 'This is a valid message with enough characters.',
    ...overrides,
  };
}

/**
 * Arbitrary that generates a Zod-accepted email address.
 *
 * Produces strings of the form `local@domain.tld` where:
 *   - local:  1–20 lowercase alphanumeric characters
 *   - domain: 1–20 lowercase alphanumeric characters
 *   - tld:    2–6 lowercase alpha characters
 *
 * This avoids the RFC 5321 special characters that fc.emailAddress() may
 * generate but Zod v4's stricter email regex rejects.
 */
const validEmailArbitrary = fc
  .tuple(
    fc.stringMatching(/^[a-z][a-z0-9]{0,19}$/),
    fc.stringMatching(/^[a-z][a-z0-9]{0,19}$/),
    fc.stringMatching(/^[a-z]{2,6}$/),
  )
  .map(([local, domain, tld]) => `${local}@${domain}.${tld}`);

// ---------------------------------------------------------------------------
// Property 1: Name bounds
// Validates: Requirements 3.1, 4.1
// ---------------------------------------------------------------------------

describe('Property 1 — name bounds', () => {
  it('accepts any name string of length 3–100 (inclusive)', () => {
    // Feature: leaddesk-mini, Property 1: Name bounds
    fc.assert(
      fc.property(
        fc.string({ minLength: 3, maxLength: 100 }),
        (name) => {
          const result = createLeadSchema.safeParse(validCreatePayload({ name }));
          expect(result.success).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('rejects any name string that is empty, shorter than 3 chars, or longer than 100 chars', () => {
    // Feature: leaddesk-mini, Property 1: Name bounds
    fc.assert(
      fc.property(
        fc.oneof(
          // Too short: 0–2 characters
          fc.string({ minLength: 0, maxLength: 2 }),
          // Too long: 101+ characters
          fc.string({ minLength: 101, maxLength: 200 }),
        ),
        (name) => {
          const result = createLeadSchema.safeParse(validCreatePayload({ name }));
          expect(result.success).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 2: Email pattern
// Validates: Requirements 3.2, 4.2
// ---------------------------------------------------------------------------

describe('Property 2 — email pattern', () => {
  it('accepts any string that structurally matches a valid email address', () => {
    // Feature: leaddesk-mini, Property 2: Email pattern
    fc.assert(
      fc.property(
        validEmailArbitrary,
        (email) => {
          const result = createLeadSchema.safeParse(validCreatePayload({ email }));
          expect(result.success).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('rejects strings that do not contain an @ sign (cannot be valid emails)', () => {
    // Feature: leaddesk-mini, Property 2: Email pattern
    fc.assert(
      fc.property(
        // Strings with no '@' sign are structurally invalid email addresses
        fc.string().filter((s) => !s.includes('@')),
        (notAnEmail) => {
          const result = createLeadSchema.safeParse(validCreatePayload({ email: notAnEmail }));
          expect(result.success).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 3: Budget enum
// Validates: Requirements 2.2, 3.3, 4.3
// ---------------------------------------------------------------------------

describe('Property 3 — budget enum', () => {
  it('accepts every one of the four exact BUDGET_OPTIONS values', () => {
    // Feature: leaddesk-mini, Property 3: Budget enum
    fc.assert(
      fc.property(
        fc.constantFrom(...BUDGET_OPTIONS),
        (budget) => {
          const result = createLeadSchema.safeParse(validCreatePayload({ budget }));
          expect(result.success).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('rejects any arbitrary string not in the BUDGET_OPTIONS set', () => {
    // Feature: leaddesk-mini, Property 3: Budget enum
    fc.assert(
      fc.property(
        fc.string().filter((s) => !(BUDGET_OPTIONS as readonly string[]).includes(s)),
        (invalidBudget) => {
          const result = createLeadSchema.safeParse(validCreatePayload({ budget: invalidBudget }));
          expect(result.success).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 4: Message bounds
// Validates: Requirements 3.4, 4.4
// ---------------------------------------------------------------------------

describe('Property 4 — message bounds', () => {
  it('accepts any message string of length 10–1000 (inclusive)', () => {
    // Feature: leaddesk-mini, Property 4: Message bounds
    fc.assert(
      fc.property(
        fc.string({ minLength: 10, maxLength: 1000 }),
        (message) => {
          const result = createLeadSchema.safeParse(validCreatePayload({ message }));
          expect(result.success).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('rejects any message string that is empty, shorter than 10 chars, or longer than 1000 chars', () => {
    // Feature: leaddesk-mini, Property 4: Message bounds
    fc.assert(
      fc.property(
        fc.oneof(
          // Too short: 0–9 characters
          fc.string({ minLength: 0, maxLength: 9 }),
          // Too long: 1001+ characters
          fc.string({ minLength: 1001, maxLength: 1200 }),
        ),
        (message) => {
          const result = createLeadSchema.safeParse(validCreatePayload({ message }));
          expect(result.success).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 5: Status enum
// Validates: Requirements 4.5, 6.3
// ---------------------------------------------------------------------------

describe('Property 5 — status enum', () => {
  it('accepts each of the three valid status values', () => {
    // Feature: leaddesk-mini, Property 5: Status enum
    fc.assert(
      fc.property(
        fc.constantFrom('New', 'Contacted', 'Closed'),
        (status) => {
          const result = updateLeadSchema.safeParse({ status });
          expect(result.success).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('rejects any arbitrary string not in {New, Contacted, Closed}', () => {
    // Feature: leaddesk-mini, Property 5: Status enum
    const validStatuses = ['New', 'Contacted', 'Closed'];
    fc.assert(
      fc.property(
        fc.string().filter((s) => !validStatuses.includes(s)),
        (invalidStatus) => {
          const result = updateLeadSchema.safeParse({ status: invalidStatus });
          expect(result.success).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 9: All errors reported simultaneously (no short-circuiting)
// Validates: Requirements 3.5
// ---------------------------------------------------------------------------

describe('Property 9 — all validation errors reported simultaneously', () => {
  it('reports an error for every invalid field simultaneously without short-circuiting', () => {
    // Feature: leaddesk-mini, Property 9: All errors reported simultaneously
    //
    // Strategy: generate a record where all four fields are simultaneously invalid,
    // then assert that the issues array has at least 4 entries (one per field).
    fc.assert(
      fc.property(
        fc.record({
          // Invalid name: 0–2 chars (too short)
          name: fc.string({ minLength: 0, maxLength: 2 }),
          // Invalid email: no '@' sign
          email: fc.string().filter((s) => !s.includes('@')),
          // Invalid budget: any string outside the enum
          budget: fc.string().filter((s) => !(BUDGET_OPTIONS as readonly string[]).includes(s)),
          // Invalid message: 0–9 chars (too short)
          message: fc.string({ minLength: 0, maxLength: 9 }),
        }),
        ({ name, email, budget, message }) => {
          const result = createLeadSchema.safeParse({ name, email, budget, message });

          // The parse must fail
          expect(result.success).toBe(false);

          // All four fields must have reported an error — no short-circuiting
          if (!result.success) {
            expect(result.error.issues.length).toBeGreaterThanOrEqual(4);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
