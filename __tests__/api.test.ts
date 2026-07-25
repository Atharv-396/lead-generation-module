/**
 * __tests__/api.test.ts
 *
 * Unit tests for API Route Handlers:
 *   POST /api/leads        (app/api/leads/route.ts)
 *   GET  /api/leads        (app/api/leads/route.ts)
 *   PATCH /api/leads/[id]  (app/api/leads/[id]/route.ts)
 *
 * Requirements: 4.1–4.6
 */

// ---------------------------------------------------------------------------
// Hoisted vi.mock calls — MUST appear before any imports
// ---------------------------------------------------------------------------
vi.mock('@/lib/env', () => ({
  validateEnv: vi.fn(),
  requireEnvVar: vi.fn(),
  REQUIRED_ENV_VARS: [],
}))

vi.mock('firebase-admin/app', () => ({
  initializeApp: vi.fn(),
  getApps: () => [],
  cert: vi.fn(),
}))

vi.mock('firebase-admin/auth', () => ({
  getAuth: vi.fn(),
}))

vi.mock('firebase-admin/firestore', () => ({
  FieldValue: { serverTimestamp: vi.fn() },
  Timestamp: class {},
}))

vi.mock('@/lib/firebase-admin', () => ({
  adminDb: {},
  adminAuth: {},
}))

vi.mock('@/lib/firestore', () => ({
  createLead: vi.fn(),
  getLeads: vi.fn(),
  updateLeadStatus: vi.fn(),
  NotFoundError: class NotFoundError extends Error {
    constructor(msg: string) {
      super(msg)
      this.name = 'NotFoundError'
      Object.setPrototypeOf(this, NotFoundError.prototype)
    }
  },
}))

// ---------------------------------------------------------------------------
// Imports — after all vi.mock calls
// ---------------------------------------------------------------------------
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { POST, GET } from '@/app/api/leads/route'
import { PATCH } from '@/app/api/leads/[id]/route'
import { createLead, getLeads, updateLeadStatus, NotFoundError } from '@/lib/firestore'

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const validLeadBody = {
  name: 'Alice Test',
  email: 'alice@example.com',
  budget: 'Under ₹10,000',
  message: 'Hello this is my test message',
}

const mockLeadResult = {
  id: '1',
  name: 'Alice Test',
  email: 'alice@example.com',
  budget: 'Under ₹10,000',
  message: 'Hello this is my test message',
  status: 'New',
  createdAt: new Date(),
  updatedAt: new Date(),
}

/** Build a minimal Request object with a JSON body */
function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// ---------------------------------------------------------------------------
// Reset mocks before each test
// ---------------------------------------------------------------------------
beforeEach(() => {
  vi.clearAllMocks()
})

// ===========================================================================
// POST /api/leads
// ===========================================================================
describe('POST /api/leads', () => {
  it('returns 201 with the created lead on valid input', async () => {
    vi.mocked(createLead).mockResolvedValue(mockLeadResult as any)

    const res = await POST(makeRequest(validLeadBody))
    const json = await res.json()

    expect(res.status).toBe(201)
    expect(json.id).toBe('1')
    expect(json.name).toBe('Alice Test')
    expect(createLead).toHaveBeenCalledOnce()
  })

  it('returns 400 with field=name when name is invalid', async () => {
    const res = await POST(makeRequest({ ...validLeadBody, name: 'AB' })) // < 3 chars
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.field).toBe('name')
    expect(createLead).not.toHaveBeenCalled()
  })

  it('returns 400 with field=email when email is invalid', async () => {
    const res = await POST(makeRequest({ ...validLeadBody, email: 'not-an-email' }))
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.field).toBe('email')
    expect(createLead).not.toHaveBeenCalled()
  })

  it('returns 400 with field=budget when budget is invalid', async () => {
    const res = await POST(makeRequest({ ...validLeadBody, budget: 'Invalid Budget' }))
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.field).toBe('budget')
    expect(createLead).not.toHaveBeenCalled()
  })

  it('returns 400 with field=message when message is too short', async () => {
    const res = await POST(makeRequest({ ...validLeadBody, message: 'Hi' })) // < 10 chars
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.field).toBe('message')
    expect(createLead).not.toHaveBeenCalled()
  })

  it('returns 500 when Firestore throws an unexpected error', async () => {
    vi.mocked(createLead).mockRejectedValue(new Error('Firestore unavailable'))

    const res = await POST(makeRequest(validLeadBody))
    const json = await res.json()

    expect(res.status).toBe(500)
    expect(json.message).toBeDefined()
  })
})

// ===========================================================================
// GET /api/leads
// ===========================================================================
describe('GET /api/leads', () => {
  it('returns 200 with array of leads', async () => {
    vi.mocked(getLeads).mockResolvedValue([mockLeadResult] as any)

    const res = await GET()
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(Array.isArray(json)).toBe(true)
    expect(json).toHaveLength(1)
    expect(json[0].id).toBe('1')
    expect(getLeads).toHaveBeenCalledOnce()
  })

  it('returns 500 when Firestore throws an unexpected error', async () => {
    vi.mocked(getLeads).mockRejectedValue(new Error('Firestore unavailable'))

    const res = await GET()
    const json = await res.json()

    expect(res.status).toBe(500)
    expect(json.message).toBeDefined()
  })
})

// ===========================================================================
// PATCH /api/leads/[id]
// ===========================================================================
describe('PATCH /api/leads/[id]', () => {
  /** Build a PATCH Request with a JSON body */
  function makePatchRequest(body: unknown): Request {
    return new Request('http://localhost/api/leads/test-id', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  it('returns 200 with the updated lead on a valid status update', async () => {
    const updated = { ...mockLeadResult, status: 'Contacted' }
    vi.mocked(updateLeadStatus).mockResolvedValue(updated as any)

    const res = await PATCH(makePatchRequest({ status: 'Contacted' }), {
      params: Promise.resolve({ id: 'test-id' }),
    })
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.status).toBe('Contacted')
    expect(updateLeadStatus).toHaveBeenCalledWith('test-id', 'Contacted')
  })

  it('returns 400 when an invalid status value is provided', async () => {
    const res = await PATCH(makePatchRequest({ status: 'InvalidStatus' }), {
      params: Promise.resolve({ id: 'test-id' }),
    })
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.field).toBe('status')
    expect(updateLeadStatus).not.toHaveBeenCalled()
  })

  it('returns 404 when the lead is not found', async () => {
    vi.mocked(updateLeadStatus).mockRejectedValue(new NotFoundError('not found'))

    const res = await PATCH(makePatchRequest({ status: 'Closed' }), {
      params: Promise.resolve({ id: 'test-id' }),
    })
    const json = await res.json()

    expect(res.status).toBe(404)
    expect(json.message).toBeDefined()
  })

  it('returns 500 when Firestore throws an unexpected error', async () => {
    vi.mocked(updateLeadStatus).mockRejectedValue(new Error('Firestore unavailable'))

    const res = await PATCH(makePatchRequest({ status: 'Closed' }), {
      params: Promise.resolve({ id: 'test-id' }),
    })
    const json = await res.json()

    expect(res.status).toBe(500)
    expect(json.message).toBeDefined()
  })
})
