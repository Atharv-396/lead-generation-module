// Feature: leaddesk-mini, Property 6: Lead creation round-trip preserves all fields and sets status to "New"
// Feature: leaddesk-mini, Property 7: Status update round-trip reflects the new status

/**
 * Property-based tests for API Route Handler round-trips.
 *
 * These tests verify that the POST /api/leads and PATCH /api/leads/[id]
 * route handlers correctly marshal inputs through validation and return
 * the expected shape from the (mocked) Firestore layer.
 *
 * All vi.mock calls are hoisted before imports by Vitest's automatic hoisting.
 */

vi.mock('@/lib/env', () => ({
  validateEnv: vi.fn(),
  requireEnvVar: vi.fn(),
  REQUIRED_ENV_VARS: [],
}));

vi.mock('firebase-admin/app', () => ({
  initializeApp: vi.fn(),
  getApps: () => [],
  cert: vi.fn(),
}));

vi.mock('firebase-admin/auth', () => ({
  getAuth: vi.fn(),
}));

vi.mock('firebase-admin/firestore', () => ({
  FieldValue: { serverTimestamp: vi.fn() },
  Timestamp: class {},
}));

vi.mock('@/lib/firebase-admin', () => ({
  adminDb: {},
  adminAuth: {},
}));

vi.mock('@/lib/firestore', () => ({
  createLead: vi.fn(),
  getLeads: vi.fn(),
  updateLeadStatus: vi.fn(),
  NotFoundError: class NotFoundError extends Error {},
}));

import * as fc from 'fast-check';
import { describe, it, expect, vi } from 'vitest';
import { POST } from '@/app/api/leads/route';
import { PATCH } from '@/app/api/leads/[id]/route';
import { createLead, updateLeadStatus } from '@/lib/firestore';
import { BUDGET_OPTIONS } from '@/types/lead';
import type { LeadStatus, BudgetOption } from '@/types/lead';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Safe email arbitrary: produces `local@domain.tld` strings that pass
 * Zod's stricter email validation (no RFC 5321 special characters).
 */
const safeEmailArb = fc
  .tuple(
    fc.stringMatching(/^[a-z][a-z0-9]{1,9}$/),
    fc.stringMatching(/^[a-z][a-z0-9]{1,9}$/),
    fc.stringMatching(/^[a-z]{2,4}$/),
  )
  .map(([l, d, t]) => `${l}@${d}.${t}`);

// ---------------------------------------------------------------------------
// Property 6: Lead creation round-trip preserves all fields and sets status to "New"
// Validates: Requirements 5.1, 5.2, 6.1, 6.2
// ---------------------------------------------------------------------------

describe('Property 6 — Lead creation round-trip', () => {
  it('preserves all input fields and sets status to "New" for every valid CreateLeadInput', async () => {
    // Feature: leaddesk-mini, Property 6: Lead creation round-trip preserves all fields and sets status to "New"
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 3, maxLength: 100 }),
          email: safeEmailArb,
          budget: fc.constantFrom(...BUDGET_OPTIONS),
          message: fc.string({ minLength: 10, maxLength: 1000 }),
        }),
        async (input) => {
          const mockLead = {
            id: '1',
            ...input,
            status: 'New' as LeadStatus,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          vi.mocked(createLead).mockResolvedValueOnce(mockLead);

          const request = new Request('http://localhost/api/leads', {
            method: 'POST',
            body: JSON.stringify(input),
            headers: { 'Content-Type': 'application/json' },
          });

          const response = await POST(request);
          const body = await response.json();

          expect(response.status).toBe(201);
          expect(body.name).toBe(input.name);
          expect(body.email).toBe(input.email);
          expect(body.budget).toBe(input.budget as BudgetOption);
          expect(body.message).toBe(input.message);
          expect(body.status).toBe('New');
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 7: Status update round-trip reflects the new status
// Validates: Requirements 5.3, 6.3
// ---------------------------------------------------------------------------

describe('Property 7 — Status update round-trip', () => {
  it('returns the updated status for every valid LeadStatus value', async () => {
    // Feature: leaddesk-mini, Property 7: Status update round-trip reflects the new status
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom<LeadStatus>('New', 'Contacted', 'Closed'),
        async (status) => {
          const mockLead = {
            id: '1',
            name: 'Test',
            email: 't@t.com',
            budget: '₹50,000+' as BudgetOption,
            message: 'test message',
            status,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          vi.mocked(updateLeadStatus).mockResolvedValueOnce(mockLead);

          const request = new Request('http://localhost/api/leads/1', {
            method: 'PATCH',
            body: JSON.stringify({ status }),
            headers: { 'Content-Type': 'application/json' },
          });

          const response = await PATCH(request, {
            params: Promise.resolve({ id: '1' }),
          });
          const body = await response.json();

          expect(response.status).toBe(200);
          expect(body.status).toBe(status);
        },
      ),
      { numRuns: 100 },
    );
  });
});
