/**
 * lib/schemas.ts
 *
 * Zod validation schemas shared between client and server.
 *
 * These schemas are the single source of truth for input validation.
 * They are imported by API Route Handlers (server-side) and by the
 * useLeadForm hook (client-side) so that the same rules are enforced
 * in both environments.
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 4.5
 */

import { z } from 'zod';
import { BUDGET_OPTIONS } from '@/types/lead';

/**
 * Schema for creating a new lead.
 *
 * Fields:
 *  - name:    3–100 characters
 *  - email:   valid e-mail address
 *  - budget:  one of the four BUDGET_OPTIONS enum values
 *  - message: 10–1000 characters
 */
export const createLeadSchema = z.object({
  name: z
    .string()
    .min(3, 'Name must be between 3 and 100 characters')
    .max(100, 'Name must be between 3 and 100 characters'),
  email: z.string().email('Please enter a valid email address'),
  budget: z.enum(BUDGET_OPTIONS, {
    error: 'Please select a budget range',
  }),
  message: z
    .string()
    .min(10, 'Message must be at least 10 characters')
    .max(1000, 'Message must be no more than 1000 characters'),
});

/**
 * Schema for updating an existing lead's status.
 *
 * Fields:
 *  - status: one of "New" | "Contacted" | "Closed"
 */
export const updateLeadSchema = z.object({
  status: z.enum(['New', 'Contacted', 'Closed'], {
    error: 'Status must be New, Contacted, or Closed',
  }),
});

/** Inferred TypeScript types from the schemas */
export type CreateLeadData = z.infer<typeof createLeadSchema>;
export type UpdateLeadData = z.infer<typeof updateLeadSchema>;
