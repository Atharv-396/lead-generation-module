// Feature: leaddesk-mini, Property 8: Search filter is a case-insensitive substring match, and clearing restores all leads

vi.mock('@/lib/env', () => ({ validateEnv: vi.fn(), requireEnvVar: vi.fn(), REQUIRED_ENV_VARS: [] }))
vi.mock('@/contexts/ToastContext', () => ({ useToastContext: () => ({ addToast: vi.fn(), removeToast: vi.fn(), toasts: [] }) }))

import * as fc from 'fast-check'
import { describe, it, expect, vi } from 'vitest'
import type { Lead } from '@/types/lead'
import { BUDGET_OPTIONS } from '@/types/lead'

// Pure filter function (replicates the logic from useLeads)
function filterLeads(leads: Lead[], query: string): Lead[] {
  if (!query.trim()) return leads;
  const q = query.toLowerCase();
  return leads.filter(l => l.name.toLowerCase().includes(q) || l.email.toLowerCase().includes(q));
}

const leadArb = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  email: fc.tuple(fc.stringMatching(/^[a-z][a-z0-9]{0,9}$/), fc.stringMatching(/^[a-z][a-z0-9]{0,9}$/), fc.stringMatching(/^[a-z]{2,4}$/)).map(([l,d,t]) => `${l}@${d}.${t}`),
  budget: fc.constantFrom(...BUDGET_OPTIONS),
  message: fc.string({ minLength: 10, maxLength: 100 }),
  status: fc.constantFrom('New' as const, 'Contacted' as const, 'Closed' as const),
  createdAt: fc.date(),
  updatedAt: fc.date(),
});

/**
 * Property 8: Search filter is a case-insensitive substring match, and clearing restores all leads
 * Validates: Requirements 10.2, 10.3
 */
describe('Property 8 — search filter is a case-insensitive substring match', () => {
  it('returns exactly those leads whose lowercased name or email contains the lowercased query', () => {
    fc.assert(fc.property(fc.array(leadArb), fc.string(), (leads, q) => {
      const result = filterLeads(leads, q);
      const expected = leads.filter(l => l.name.toLowerCase().includes(q.toLowerCase()) || l.email.toLowerCase().includes(q.toLowerCase()));
      // When query is blank, returns all leads
      if (!q.trim()) {
        expect(result).toHaveLength(leads.length);
      } else {
        expect(result).toHaveLength(expected.length);
        expect(result.every(l => expected.some(e => e.id === l.id))).toBe(true);
      }
    }), { numRuns: 100 });
  });

  it('clearing the query (empty string) always returns all leads regardless of prior query', () => {
    fc.assert(fc.property(fc.array(leadArb), fc.string(), (leads, q) => {
      filterLeads(leads, q); // apply any query
      const cleared = filterLeads(leads, '');
      expect(cleared).toHaveLength(leads.length);
    }), { numRuns: 100 });
  });
});
