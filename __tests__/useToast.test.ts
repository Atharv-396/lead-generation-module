import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useToast } from '@/hooks/useToast'

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('addToast — adds a toast to the queue with correct message and type', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.addToast('Hello world', 'success')
    })

    expect(result.current.toasts).toHaveLength(1)
    expect(result.current.toasts[0].message).toBe('Hello world')
    expect(result.current.toasts[0].type).toBe('success')
  })

  it('removeToast — manually removes a toast before auto-dismiss', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.addToast('Remove me', 'error')
    })

    expect(result.current.toasts).toHaveLength(1)
    const id = result.current.toasts[0].id

    act(() => {
      result.current.removeToast(id)
    })

    expect(result.current.toasts).toHaveLength(0)
  })

  it('auto-dismiss — removes toast from queue after 4000ms', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.addToast('Auto dismiss me', 'success')
    })

    expect(result.current.toasts).toHaveLength(1)

    act(() => {
      vi.advanceTimersByTime(4000)
    })

    expect(result.current.toasts).toHaveLength(0)
  })

  it('multiple concurrent toasts — adding 3 toasts results in 3 items; each dismisses independently', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.addToast('Toast 1', 'success')
      result.current.addToast('Toast 2', 'error')
      result.current.addToast('Toast 3', 'success')
    })

    expect(result.current.toasts).toHaveLength(3)

    // Manually remove the second toast
    const secondId = result.current.toasts[1].id
    act(() => {
      result.current.removeToast(secondId)
    })

    expect(result.current.toasts).toHaveLength(2)
    expect(result.current.toasts.find((t) => t.id === secondId)).toBeUndefined()

    // Advance time — remaining two auto-dismiss
    act(() => {
      vi.advanceTimersByTime(4000)
    })

    expect(result.current.toasts).toHaveLength(0)
  })

  it('cancel timer on manual dismiss — no error thrown when timer fires after manual removal', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.addToast('Cancel timer', 'success')
    })

    const id = result.current.toasts[0].id

    // Manually dismiss before 4000ms
    act(() => {
      result.current.removeToast(id)
    })

    expect(result.current.toasts).toHaveLength(0)

    // Advance past the auto-dismiss threshold — should not throw or add toasts back
    expect(() => {
      act(() => {
        vi.advanceTimersByTime(4000)
      })
    }).not.toThrow()

    expect(result.current.toasts).toHaveLength(0)
  })
})
