import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAuth } from '@/hooks/useAuth'
import { signInWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth'

const mockPush = vi.hoisted(() => vi.fn())
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }))
vi.mock('@/lib/firebase-client', () => ({ auth: {} }))
vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn((auth, cb) => { cb(null); return vi.fn(); }),
}))
vi.mock('@/lib/env', () => ({ validateEnv: vi.fn(), requireEnvVar: vi.fn(), REQUIRED_ENV_VARS: [] }))

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))
})

describe('useAuth', () => {
  it('redirects to /admin on successful sign in', async () => {
    const mockGetIdToken = vi.fn().mockResolvedValue('token')
    vi.mocked(signInWithEmailAndPassword).mockResolvedValue({
      user: { getIdToken: mockGetIdToken },
    } as any)

    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await result.current.signIn('admin@test.com', 'password')
    })

    expect(mockPush).toHaveBeenCalledWith('/admin')
  })

  it('throws a user-friendly error on sign in failure', async () => {
    vi.mocked(signInWithEmailAndPassword).mockRejectedValue(
      new Error('Firebase: wrong-password (auth/wrong-password)')
    )

    const { result } = renderHook(() => useAuth())

    await expect(
      act(async () => {
        await result.current.signIn('admin@test.com', 'wrongpassword')
      })
    ).rejects.toThrow('Incorrect email or password')
  })

  it('calls /api/session/logout and firebase signOut on sign out', async () => {
    vi.mocked(firebaseSignOut).mockResolvedValue(undefined)

    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await result.current.signOut()
    })

    expect(fetch).toHaveBeenCalledWith('/api/session/logout', { method: 'POST' })
    expect(firebaseSignOut).toHaveBeenCalled()
  })
})
