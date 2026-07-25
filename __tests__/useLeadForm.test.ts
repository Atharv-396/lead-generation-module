/**
 * __tests__/useLeadForm.test.ts
 *
 * Unit tests for the useLeadForm hook.
 *
 * Requirements: 2.3, 2.4, 2.5, 2.6, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 13.1
 */

// ---------------------------------------------------------------------------
// Hoisted mocks — must be declared before vi.mock factories run
// ---------------------------------------------------------------------------
const mockAddToast = vi.hoisted(() => vi.fn())

vi.mock('@/lib/env', () => ({
  validateEnv: vi.fn(),
  requireEnvVar: vi.fn(),
  REQUIRED_ENV_VARS: [],
}))

vi.mock('@/contexts/ToastContext', () => ({
  useToastContext: () => ({ addToast: mockAddToast, removeToast: vi.fn(), toasts: [] }),
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLeadForm } from '@/hooks/useLeadForm'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const validData = {
  name: 'Alice Test',
  email: 'alice@example.com',
  budget: 'Under ₹10,000',
  message: 'Hello this is a valid message for testing',
}

/** Fill all fields of the hook with validData */
function fillValidFields(result: ReturnType<typeof useLeadForm>) {
  act(() => {
    result.handleChange('name', validData.name)
    result.handleChange('email', validData.email)
    result.handleChange('budget', validData.budget)
    result.handleChange('message', validData.message)
  })
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------
beforeEach(() => {
  vi.clearAllMocks()
  vi.useRealTimers()
  vi.stubGlobal('fetch', vi.fn())
})

// ===========================================================================
// Tests
// ===========================================================================
describe('useLeadForm', () => {
  // ── 1. Field change ────────────────────────────────────────────────────────
  it('updates a field value when handleChange is called', () => {
    const { result } = renderHook(() => useLeadForm())

    act(() => {
      result.current.handleChange('name', 'Bob')
    })

    expect(result.current.fields.name).toBe('Bob')
  })

  // ── 2. Validation errors populated on empty submit ─────────────────────────
  it('sets validation errors for all fields when submitted empty and does not call fetch', async () => {
    const { result } = renderHook(() => useLeadForm())

    const fakeEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent

    await act(async () => {
      await result.current.handleSubmit(fakeEvent)
    })

    expect(result.current.errors.name).toBeTruthy()
    expect(result.current.errors.email).toBeTruthy()
    expect(result.current.errors.budget).toBeTruthy()
    expect(result.current.errors.message).toBeTruthy()
    expect(fetch).not.toHaveBeenCalled()
  })

  // ── 3. Loading state ───────────────────────────────────────────────────────
  it('sets isLoading true during API call and false after it resolves', async () => {
    let resolveFetch!: (value: Response) => void
    const pendingFetch = new Promise<Response>((resolve) => {
      resolveFetch = resolve
    })
    vi.mocked(fetch).mockReturnValueOnce(pendingFetch)

    const { result } = renderHook(() => useLeadForm())
    fillValidFields(result.current)

    const fakeEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent

    // Start submission without awaiting so we can check intermediate state
    let submitPromise: Promise<void>
    act(() => {
      submitPromise = result.current.handleSubmit(fakeEvent)
    })

    // isLoading should be true while fetch is pending
    expect(result.current.isLoading).toBe(true)

    // Resolve the fetch
    await act(async () => {
      resolveFetch(new Response(null, { status: 201 }))
      await submitPromise
    })

    expect(result.current.isLoading).toBe(false)
  })

  // ── 4. Success: toast shown, fields reset ──────────────────────────────────
  it('calls addToast with success and resets fields on a 201 response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 201 }))

    const { result } = renderHook(() => useLeadForm())
    fillValidFields(result.current)

    const fakeEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent

    await act(async () => {
      await result.current.handleSubmit(fakeEvent)
    })

    expect(mockAddToast).toHaveBeenCalledWith('Lead Submitted Successfully', 'success')
    expect(result.current.fields.name).toBe('')
    expect(result.current.fields.email).toBe('')
    expect(result.current.fields.budget).toBe('')
    expect(result.current.fields.message).toBe('')
  })

  // ── 5. Failure: toast shown, fields preserved ──────────────────────────────
  it('calls addToast with error and preserves fields on a non-201 response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 500 }))

    const { result } = renderHook(() => useLeadForm())
    fillValidFields(result.current)

    const fakeEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent

    await act(async () => {
      await result.current.handleSubmit(fakeEvent)
    })

    expect(mockAddToast).toHaveBeenCalledWith('Submission Failed', 'error')
    expect(result.current.fields.name).toBe(validData.name)
    expect(result.current.fields.email).toBe(validData.email)
    expect(result.current.fields.budget).toBe(validData.budget)
    expect(result.current.fields.message).toBe(validData.message)
  })

  // ── 6. 10-second timeout abort ─────────────────────────────────────────────
  it('calls addToast with error when the request times out after 10 seconds', async () => {
    vi.useFakeTimers()

    // A fetch that responds to AbortController abort
    vi.mocked(fetch).mockImplementation((_url: RequestInfo | URL, init?: RequestInit) => {
      return new Promise<Response>((_resolve, reject) => {
        const signal = init?.signal
        if (signal) {
          signal.addEventListener('abort', () => {
            reject(new DOMException('The operation was aborted.', 'AbortError'))
          })
        }
      })
    })

    const { result } = renderHook(() => useLeadForm())
    fillValidFields(result.current)

    const fakeEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent

    // Start submission (don't await — let fake timers drive it)
    act(() => {
      result.current.handleSubmit(fakeEvent)
    })

    // Advance fake clock past the 10-second threshold, which fires the AbortController
    await act(async () => {
      vi.advanceTimersByTime(10001)
    })

    // Flush remaining microtasks so the abort rejection propagates through the hook
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(mockAddToast).toHaveBeenCalledWith('Submission Failed', 'error')

    vi.useRealTimers()
  }, 15000)
})
