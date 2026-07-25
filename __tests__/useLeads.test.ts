/**
 * __tests__/useLeads.test.ts
 *
 * Unit tests for the useLeads hook.
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

// ---------------------------------------------------------------------------
// Hoisted mocks — must be declared before vi.mock factories run
// ---------------------------------------------------------------------------
const { mockAddToast } = vi.hoisted(() => {
  const mockAddToast = vi.fn()
  return { mockAddToast }
})

vi.mock('@/lib/env', () => ({
  validateEnv: vi.fn(),
  requireEnvVar: vi.fn(),
  REQUIRED_ENV_VARS: [],
}))

vi.mock('@/contexts/ToastContext', () => ({
  useToastContext: () => ({ addToast: mockAddToast, removeToast: vi.fn(), toasts: [] }),
}))

// ---------------------------------------------------------------------------
// Import the hook under test AFTER all mocks are in place
// ---------------------------------------------------------------------------
import { useLeads } from '@/hooks/useLeads'
import type { Lead } from '@/types/lead'

// ---------------------------------------------------------------------------
// Shared fixture
// ---------------------------------------------------------------------------
const leadFixture: Lead = {
  id: '1',
  name: 'Alice Smith',
  email: 'alice@test.com',
  budget: 'Under ₹10,000' as const,
  message: 'Hello world msg',
  status: 'New' as const,
  createdAt: new Date(),
  updatedAt: new Date(),
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeFetchResponse(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response
}

// ---------------------------------------------------------------------------
// Reset mocks before each test
// ---------------------------------------------------------------------------
beforeEach(() => {
  vi.clearAllMocks()
  vi.unstubAllGlobals()
})

// ===========================================================================
// Tests
// ===========================================================================

describe('useLeads', () => {
  // -------------------------------------------------------------------------
  // 1. Initial load
  // -------------------------------------------------------------------------
  it('loads leads on mount: populates leads array and clears isLoading', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeFetchResponse([leadFixture])))

    const { result } = renderHook(() => useLeads())

    // Initially loading
    expect(result.current.isLoading).toBe(true)

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.leads).toHaveLength(1)
    expect(result.current.leads[0].id).toBe('1')
    expect(result.current.leads[0].name).toBe('Alice Smith')
    expect(result.current.error).toBeNull()
  })

  // -------------------------------------------------------------------------
  // 2. Error state
  // -------------------------------------------------------------------------
  it('sets error when fetch rejects and clears isLoading', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network failure')))

    const { result } = renderHook(() => useLeads())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.error).toBe('Network failure')
    expect(result.current.leads).toHaveLength(0)
  })

  // -------------------------------------------------------------------------
  // 3. Retry
  // -------------------------------------------------------------------------
  it('retries fetch on retry() call: populates leads after initial failure', async () => {
    const mockFetch = vi.fn()
      .mockRejectedValueOnce(new Error('First attempt failed'))
      .mockResolvedValueOnce(makeFetchResponse([leadFixture]))

    vi.stubGlobal('fetch', mockFetch)

    const { result } = renderHook(() => useLeads())

    // Wait for first (failed) fetch to settle
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.error).toBe('First attempt failed')

    // Trigger retry
    act(() => {
      result.current.retry()
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.error).toBeNull()
    expect(result.current.leads).toHaveLength(1)
    expect(result.current.leads[0].name).toBe('Alice Smith')
  })

  // -------------------------------------------------------------------------
  // 4. Search filter reactivity
  // -------------------------------------------------------------------------
  it('filters filteredLeads by searchQuery and returns all leads when query is cleared', async () => {
    const secondLead: Lead = {
      ...leadFixture,
      id: '2',
      name: 'Bob Jones',
      email: 'bob@test.com',
    }
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(makeFetchResponse([leadFixture, secondLead])),
    )

    const { result } = renderHook(() => useLeads())

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.leads).toHaveLength(2)

    // Apply search query matching only Alice
    act(() => {
      result.current.setSearchQuery('alice')
    })

    expect(result.current.filteredLeads).toHaveLength(1)
    expect(result.current.filteredLeads[0].name).toBe('Alice Smith')

    // Clear search query — all leads should be returned
    act(() => {
      result.current.setSearchQuery('')
    })

    expect(result.current.filteredLeads).toHaveLength(2)
  })

  // -------------------------------------------------------------------------
  // 5. Optimistic update success
  // -------------------------------------------------------------------------
  it('calls addToast with success message when PATCH returns ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn()
        .mockResolvedValueOnce(makeFetchResponse([leadFixture]))      // GET /api/leads
        .mockResolvedValueOnce(makeFetchResponse({}, true)),          // PATCH /api/leads/1
    )

    const { result } = renderHook(() => useLeads())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.updateStatus('1', 'Contacted')
    })

    expect(mockAddToast).toHaveBeenCalledWith('Status Updated', 'success')
  })

  // -------------------------------------------------------------------------
  // 6. Optimistic update revert on failure
  // -------------------------------------------------------------------------
  it('reverts lead status and calls addToast with error message when PATCH returns !ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn()
        .mockResolvedValueOnce(makeFetchResponse([leadFixture]))       // GET /api/leads
        .mockResolvedValueOnce(makeFetchResponse({}, false, 500)),     // PATCH returns !ok
    )

    const { result } = renderHook(() => useLeads())

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.leads[0].status).toBe('New')

    await act(async () => {
      await result.current.updateStatus('1', 'Contacted')
    })

    // Status should be reverted to original
    expect(result.current.leads[0].status).toBe('New')
    expect(mockAddToast).toHaveBeenCalledWith(
      'Failed to update status. Please try again.',
      'error',
    )
  })
})
