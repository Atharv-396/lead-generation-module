/**
 * app/api/leads/route.ts
 *
 * Route Handlers for the /api/leads endpoint.
 *
 * POST: Create a new lead (public, no auth required)
 * GET:  Retrieve all leads ordered by createdAt descending
 *
 * Uses the Node.js runtime — the Firebase Admin SDK requires Node.js built-ins
 * and is incompatible with the Edge runtime.
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.4, 6.1, 6.2, 6.5, 6.6, 18.2
 */

import { createLeadSchema } from '@/lib/schemas';
import { createLead, getLeads } from '@/lib/firestore';

// Must be 'nodejs' — never 'edge' — so the Firebase Admin SDK can run.
export const runtime = 'nodejs';

/**
 * POST /api/leads
 *
 * Accepts a CreateLeadInput body, validates it with Zod, and persists a new
 * lead document in Firestore. Returns the full Lead object on success.
 *
 * Responses:
 *   201  Lead JSON
 *   400  { field: string, message: string }  — first validation error
 *   500  { message: string }                 — unexpected server error
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createLeadSchema.safeParse(body);

    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return Response.json(
        { field: issue.path[0], message: issue.message },
        { status: 400 }
      );
    }

    const lead = await createLead(parsed.data);
    return Response.json(lead, { status: 201 });
  } catch (error) {
    console.error('[POST /api/leads]', error);
    return Response.json({ message: 'An internal error occurred' }, { status: 500 });
  }
}

/**
 * GET /api/leads
 *
 * Returns all leads from Firestore ordered by createdAt descending.
 *
 * Responses:
 *   200  Lead[]
 *   500  { message: string }  — unexpected server error
 */
export async function GET() {
  try {
    const leads = await getLeads();
    return Response.json(leads, { status: 200 });
  } catch (error) {
    console.error('[GET /api/leads]', error);
    return Response.json({ message: 'An internal error occurred' }, { status: 500 });
  }
}
