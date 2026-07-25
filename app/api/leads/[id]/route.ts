/**
 * app/api/leads/[id]/route.ts
 *
 * PATCH /api/leads/[id] — Update the status of an existing lead.
 *
 * Request body: { status: "New" | "Contacted" | "Closed" }
 *
 * Responses:
 *   200  Lead JSON                              — status updated successfully
 *   400  { field: 'status', message: string }  — invalid or missing status value
 *   404  { message: string }                   — lead with the given id does not exist
 *   500  { message: string }                   — unexpected server error
 *
 * Requirements: 4.5, 4.6, 5.3, 5.5, 6.3, 6.4, 6.5, 18.2
 */

import { updateLeadSchema } from '@/lib/schemas';
import { updateLeadStatus, NotFoundError } from '@/lib/firestore';

// Must be 'nodejs' — never 'edge' — so the Firebase Admin SDK can run.
export const runtime = 'nodejs';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const body = await request.json();
    const parsed = updateLeadSchema.safeParse(body);

    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return Response.json(
        { field: 'status', message: issue.message },
        { status: 400 }
      );
    }

    const { status } = parsed.data;
    const lead = await updateLeadStatus(id, status);

    return Response.json(lead, { status: 200 });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return Response.json({ message: 'Lead not found' }, { status: 404 });
    }

    console.error('[PATCH /api/leads/[id]]', error);
    return Response.json(
      { message: 'An internal error occurred' },
      { status: 500 }
    );
  }
}
