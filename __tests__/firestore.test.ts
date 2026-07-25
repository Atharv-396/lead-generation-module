/**
 * __tests__/firestore.test.ts
 *
 * Unit tests for lib/firestore.ts Firestore CRUD helpers.
 *
 * The Firebase Admin SDK and env validation are fully mocked so that tests
 * run without real Firebase credentials.
 *
 * Requirements: 5.1, 5.2, 5.3
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Sentinel value returned by FieldValue.serverTimestamp()
// ---------------------------------------------------------------------------
const SERVER_TIMESTAMP_SENTINEL = Symbol('serverTimestamp');

// ---------------------------------------------------------------------------
// Hoisted mocks — must be declared before vi.mock factories run
// ---------------------------------------------------------------------------
const { mockAdminDb, mockCollection, mockDocRef, mockAddShouldFail, MockTimestamp } = vi.hoisted(() => {
  class MockTimestamp {
    constructor(public seconds: number, public nanoseconds: number) {}
    toDate() {
      return new Date(this.seconds * 1000 + Math.floor(this.nanoseconds / 1e6));
    }
    static fromDate(date: Date) {
      return new MockTimestamp(
        Math.floor(date.getTime() / 1000),
        (date.getTime() % 1000) * 1e6
      );
    }
  }

  const mockDocRef = {
    id: 'generated-doc-id',
    get: vi.fn(),
    update: vi.fn(),
  };

  const mockCollection = {
    add: vi.fn(),
    doc: vi.fn(),
    orderBy: vi.fn(),
  };

  const mockAdminDb = {
    collection: vi.fn(() => mockCollection),
  };

  const mockAddShouldFail = { value: false };

  return { mockAdminDb, mockCollection, mockDocRef, mockAddShouldFail, MockTimestamp };
});

// ---------------------------------------------------------------------------
// Mock @/lib/env — prevent validateEnv() from throwing at module init
// ---------------------------------------------------------------------------
vi.mock('@/lib/env', () => ({
  REQUIRED_ENV_VARS: [],
  validateEnv: vi.fn(),
  requireEnvVar: vi.fn((key: string) => `mock_${key}`),
}));

// ---------------------------------------------------------------------------
// Mock firebase-admin/firestore (FieldValue, Timestamp used in lib/firestore)
// ---------------------------------------------------------------------------
vi.mock('firebase-admin/firestore', () => ({
  FieldValue: {
    serverTimestamp: vi.fn(() => SERVER_TIMESTAMP_SENTINEL),
  },
  Timestamp: MockTimestamp,
}));

// ---------------------------------------------------------------------------
// Mock @/lib/firebase-admin — return mockAdminDb
// ---------------------------------------------------------------------------
vi.mock('@/lib/firebase-admin', () => ({
  adminAuth: {},
  adminDb: mockAdminDb,
}));

// ---------------------------------------------------------------------------
// Import the module under test AFTER all mocks are in place
// ---------------------------------------------------------------------------
import { createLead, getLeads, updateLeadStatus, NotFoundError } from '@/lib/firestore';
import { Timestamp } from 'firebase-admin/firestore';

// ---------------------------------------------------------------------------
// Mutable test state
// ---------------------------------------------------------------------------
let mockDocData: Record<string, unknown> | null = null;
let mockDocExists = true;
let mockQueryDocs: Array<{ id: string; data: () => Record<string, unknown> }> = [];
let mockDocId = 'generated-doc-id';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Builds a mock Firestore Timestamp-like object using the mocked Timestamp class
 *  so that `instanceof Timestamp` checks in snapshotToLead() pass correctly. */
function makeMockTimestamp(date: Date) {
  // Use Timestamp.fromDate from the mocked module — creates an instance of
  // the mock Timestamp class, so `instanceof Timestamp` in firestore.ts passes.
  return Timestamp.fromDate(date);
}

/** A full lead data payload as it would be stored in Firestore */
function makeFirestoreLeadData(overrides: Record<string, unknown> = {}) {
  const now = new Date('2024-01-15T10:00:00Z');
  return {
    name: 'Alice',
    email: 'alice@example.com',
    budget: 'Under ₹10,000',
    message: 'Looking for CRM help',
    status: 'New',
    createdAt: makeMockTimestamp(now),
    updatedAt: makeMockTimestamp(now),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Reset mocks before each test
// ---------------------------------------------------------------------------
beforeEach(() => {
  vi.clearAllMocks();

  mockDocId = 'generated-doc-id';
  mockDocExists = true;
  mockDocData = makeFirestoreLeadData();
  mockQueryDocs = [];
  mockAddShouldFail.value = false;

  // adminDb.collection always returns mockCollection
  mockAdminDb.collection.mockReturnValue(mockCollection);

  // Default add(): succeed and return a docRef whose get() returns mockDocData
  mockCollection.add.mockImplementation(async () => {
    if (mockAddShouldFail.value) throw new Error('Firestore add failed');
    return {
      id: mockDocId,
      get: vi.fn(async () => ({
        data: () => mockDocData,
        exists: true,
      })),
    };
  });

  // Default doc(): return mockDocRef
  mockCollection.doc.mockReturnValue(mockDocRef);
  mockDocRef.get.mockImplementation(async () => ({
    exists: mockDocExists,
    data: () => mockDocData,
  }));
  mockDocRef.update.mockResolvedValue(undefined);

  // Default orderBy().get() returns mockQueryDocs
  mockCollection.orderBy.mockReturnValue({
    get: vi.fn(async () => ({ docs: mockQueryDocs })),
  });
});

// ===========================================================================
// createLead
// ===========================================================================
describe('createLead', () => {
  it('happy path: sets status="New", calls serverTimestamp for createdAt/updatedAt, returns Lead with generated id', async () => {
    const { FieldValue } = await import('firebase-admin/firestore');

    const input = {
      name: 'Alice',
      email: 'alice@example.com',
      budget: 'Under ₹10,000' as const,
      message: 'Looking for CRM help',
    };

    const lead = await createLead(input);

    // Verify collection was called with the leads collection name
    expect(mockAdminDb.collection).toHaveBeenCalledWith('leads');

    // Verify add() was called
    expect(mockCollection.add).toHaveBeenCalledTimes(1);

    // Verify status was set to "New"
    const addCallArg = mockCollection.add.mock.calls[0][0] as Record<string, unknown>;
    expect(addCallArg.status).toBe('New');

    // Verify serverTimestamp() was called for both createdAt and updatedAt
    expect(FieldValue.serverTimestamp).toHaveBeenCalledTimes(2);
    expect(addCallArg.createdAt).toBe(SERVER_TIMESTAMP_SENTINEL);
    expect(addCallArg.updatedAt).toBe(SERVER_TIMESTAMP_SENTINEL);

    // Verify the returned Lead has the generated id
    expect(lead.id).toBe(mockDocId);

    // Verify all input fields are present
    expect(lead.name).toBe(input.name);
    expect(lead.email).toBe(input.email);
    expect(lead.budget).toBe(input.budget);
    expect(lead.message).toBe(input.message);
    expect(lead.status).toBe('New');

    // Verify timestamps are mapped to Date objects
    expect(lead.createdAt).toBeInstanceOf(Date);
    expect(lead.updatedAt).toBeInstanceOf(Date);
  });

  it('propagates error when Firestore add() fails', async () => {
    mockAddShouldFail.value = true;

    const input = {
      name: 'Bob',
      email: 'bob@example.com',
      budget: '₹10,000 – ₹25,000' as const,
      message: 'Need a demo of the platform',
    };

    await expect(createLead(input)).rejects.toThrow('Firestore add failed');
  });
});

// ===========================================================================
// getLeads
// ===========================================================================
describe('getLeads', () => {
  it('returns an array of leads with Firestore Timestamps mapped to Dates', async () => {
    const date1 = new Date('2024-01-15T10:00:00Z');
    const date2 = new Date('2024-01-10T08:00:00Z');

    mockQueryDocs = [
      {
        id: 'lead-1',
        data: () => ({
          name: 'Alice',
          email: 'alice@example.com',
          budget: 'Under ₹10,000',
          message: 'First lead message here',
          status: 'New',
          createdAt: makeMockTimestamp(date1),
          updatedAt: makeMockTimestamp(date1),
        }),
      },
      {
        id: 'lead-2',
        data: () => ({
          name: 'Bob',
          email: 'bob@example.com',
          budget: '₹50,000+',
          message: 'Second lead message here',
          status: 'Contacted',
          createdAt: makeMockTimestamp(date2),
          updatedAt: makeMockTimestamp(date2),
        }),
      },
    ];

    // Re-wire orderBy to return the updated mockQueryDocs
    mockCollection.orderBy.mockReturnValue({
      get: vi.fn(async () => ({ docs: mockQueryDocs })),
    });

    const leads = await getLeads();

    expect(leads).toHaveLength(2);

    // First lead
    expect(leads[0].id).toBe('lead-1');
    expect(leads[0].name).toBe('Alice');
    expect(leads[0].status).toBe('New');
    expect(leads[0].createdAt).toBeInstanceOf(Date);
    expect(leads[0].createdAt.getTime()).toBe(date1.getTime());
    expect(leads[0].updatedAt).toBeInstanceOf(Date);

    // Second lead
    expect(leads[1].id).toBe('lead-2');
    expect(leads[1].name).toBe('Bob');
    expect(leads[1].status).toBe('Contacted');
    expect(leads[1].createdAt.getTime()).toBe(date2.getTime());

    // Verify ordered by createdAt desc
    expect(mockCollection.orderBy).toHaveBeenCalledWith('createdAt', 'desc');
  });

  it('returns an empty array when the collection is empty', async () => {
    mockQueryDocs = [];
    mockCollection.orderBy.mockReturnValue({
      get: vi.fn(async () => ({ docs: [] })),
    });

    const leads = await getLeads();

    expect(leads).toEqual([]);
  });
});

// ===========================================================================
// updateLeadStatus
// ===========================================================================
describe('updateLeadStatus', () => {
  it('happy path: updates status and updatedAt, returns updated Lead', async () => {
    const { FieldValue } = await import('firebase-admin/firestore');
    const updatedDate = new Date('2024-01-20T12:00:00Z');

    // First get() call: document exists (existence check)
    // Second get() call after update: returns updated data
    let callCount = 0;
    mockDocRef.get.mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        // Existence check — doc exists
        return { exists: true, data: () => makeFirestoreLeadData() };
      }
      // After update — return with new status
      return {
        exists: true,
        data: () =>
          makeFirestoreLeadData({
            status: 'Contacted',
            updatedAt: makeMockTimestamp(updatedDate),
          }),
      };
    });

    const lead = await updateLeadStatus('lead-123', 'Contacted');

    // Verify doc() was called with correct id
    expect(mockCollection.doc).toHaveBeenCalledWith('lead-123');

    // Verify update() was called with new status and serverTimestamp for updatedAt
    expect(mockDocRef.update).toHaveBeenCalledTimes(1);
    const updateArg = mockDocRef.update.mock.calls[0][0] as Record<string, unknown>;
    expect(updateArg.status).toBe('Contacted');
    expect(updateArg.updatedAt).toBe(SERVER_TIMESTAMP_SENTINEL);
    expect(FieldValue.serverTimestamp).toHaveBeenCalled();

    // Verify the returned Lead reflects the new status
    expect(lead.id).toBe('lead-123');
    expect(lead.status).toBe('Contacted');
    expect(lead.updatedAt).toBeInstanceOf(Date);
    expect(lead.updatedAt.getTime()).toBe(updatedDate.getTime());
  });

  it('throws NotFoundError when document does not exist', async () => {
    mockDocRef.get.mockResolvedValue({ exists: false, data: () => null });

    await expect(updateLeadStatus('non-existent-id', 'Closed')).rejects.toThrow(
      NotFoundError
    );
    await expect(updateLeadStatus('non-existent-id', 'Closed')).rejects.toThrow(
      'Lead not found: non-existent-id'
    );

    // update() should NOT have been called
    expect(mockDocRef.update).not.toHaveBeenCalled();
  });
});
