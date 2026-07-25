/**
 * lib/firestore.ts
 *
 * Realtime Database CRUD helpers for the leads node (server-only).
 * Replaces the original Firestore implementation — all callers remain unchanged.
 *
 * Data structure in Realtime Database:
 *   /leads/{pushId}: { id, name, email, budget, message, status, createdAt, updatedAt }
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3
 */

import { adminDb } from '@/lib/firebase-admin';
import type { Lead, CreateLeadInput, LeadStatus } from '@/types/lead';

const LEADS_PATH = 'leads';

// ---------------------------------------------------------------------------
// Custom error types
// ---------------------------------------------------------------------------

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

// ---------------------------------------------------------------------------
// Helper: convert a raw RTDB value to a Lead
// ---------------------------------------------------------------------------

function rawToLead(id: string, data: Record<string, unknown>): Lead {
  return {
    id,
    name: data.name as string,
    email: data.email as string,
    budget: data.budget as Lead['budget'],
    message: data.message as string,
    status: data.status as LeadStatus,
    createdAt: new Date(data.createdAt as number),
    updatedAt: new Date(data.updatedAt as number),
  };
}

// ---------------------------------------------------------------------------
// CRUD helpers
// ---------------------------------------------------------------------------

/**
 * Creates a new lead in Realtime Database using push() for a unique key.
 * Sets status = "New" and timestamps as Date.now() ms values.
 */
export async function createLead(input: CreateLeadInput): Promise<Lead> {
  const now = Date.now();
  const leadsRef = adminDb.ref(LEADS_PATH);
  const newRef = leadsRef.push();

  const id = newRef.key as string;

  const data = {
    id,
    name: input.name,
    email: input.email,
    budget: input.budget,
    message: input.message,
    status: 'New' as LeadStatus,
    createdAt: now,
    updatedAt: now,
  };

  await newRef.set(data);

  return rawToLead(id, data);
}

/**
 * Retrieves all leads ordered by createdAt descending (newest first).
 */
export async function getLeads(): Promise<Lead[]> {
  const snapshot = await adminDb
    .ref(LEADS_PATH)
    .orderByChild('createdAt')
    .once('value');

  const leads: Lead[] = [];

  snapshot.forEach((child) => {
    const data = child.val() as Record<string, unknown>;
    leads.push(rawToLead(child.key as string, data));
  });

  // RTDB orderByChild returns ascending; reverse for newest-first
  return leads.reverse();
}

/**
 * Updates the status of an existing lead.
 * Throws NotFoundError if the lead does not exist.
 */
export async function updateLeadStatus(
  id: string,
  status: LeadStatus
): Promise<Lead> {
  const leadRef = adminDb.ref(`${LEADS_PATH}/${id}`);
  const snapshot = await leadRef.once('value');

  if (!snapshot.exists()) {
    throw new NotFoundError(`Lead not found: ${id}`);
  }

  const updatedAt = Date.now();
  await leadRef.update({ status, updatedAt });

  const updated = snapshot.val() as Record<string, unknown>;
  return rawToLead(id, { ...updated, status, updatedAt });
}
