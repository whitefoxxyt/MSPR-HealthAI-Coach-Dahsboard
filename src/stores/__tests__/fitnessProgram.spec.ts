import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useFitnessProgramStore } from '../fitnessProgram'

const AUTH_STORAGE_KEY = 'healthai.auth.session'

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function seedAuthSession() {
  localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({
      user: { id: 'user-1', username: 'arthur', email: 'arthur@healthai.test', role: 'user' },
      tokens: {
        accessToken: 'jwt-test-token',
        refreshToken: 'refresh-token',
        expiresAt: '2099-01-01T00:00:00.000Z',
      },
    }),
  )
}

const PROGRAM_PAYLOAD = {
  program_id: 'prog-123',
  user_id: 'user-1',
  duration_weeks: 4,
  scoring_strategy: 'hybrid_rank_fusion',
  tier_at_generation: 'premium',
  weeks: [
    [
      [
        {
          id: 12,
          name: 'Bench Press',
          target_muscles: ['chest', 'triceps'],
          equipment: ['barbell', 'bench'],
          difficulty: 'intermediate',
          category: 'compound',
        },
      ],
    ],
  ],
  created_at: '2026-05-22T12:00:00Z',
}

describe('useFitnessProgramStore', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    setActivePinia(createPinia())
    seedAuthSession()
    fetchSpy = vi.spyOn(globalThis, 'fetch')
  })

  afterEach(() => {
    fetchSpy.mockRestore()
    localStorage.removeItem(AUTH_STORAGE_KEY)
  })

  it('initialises with empty state', () => {
    const store = useFitnessProgramStore()

    expect(store.program).toBeNull()
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('submitProgram populates the current program on success', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse(PROGRAM_PAYLOAD))
    const store = useFitnessProgramStore()

    await store.submitProgram()

    expect(store.program).toEqual(PROGRAM_PAYLOAD)
    expect(store.error).toBeNull()
    expect(store.loading).toBe(false)
  })

  it('submitProgram captures ApiError with retryAfter on 429', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response('Too Many Requests', {
        status: 429,
        headers: { 'Retry-After': '17' },
      }),
    )
    const store = useFitnessProgramStore()

    await store.submitProgram()

    expect(store.program).toBeNull()
    expect(store.error?.status).toBe(429)
    expect(store.error?.retryAfter).toBe(17)
    expect(store.loading).toBe(false)
  })

  it('submitProgram captures ApiError on 5xx', async () => {
    fetchSpy.mockResolvedValueOnce(new Response('Server Error', { status: 503 }))
    const store = useFitnessProgramStore()

    await store.submitProgram()

    expect(store.error?.status).toBe(503)
    expect(store.program).toBeNull()
  })

  it('submitProgram replaces the previous program on a second successful call', async () => {
    const first = { ...PROGRAM_PAYLOAD, program_id: 'prog-first' }
    const second = { ...PROGRAM_PAYLOAD, program_id: 'prog-second' }
    fetchSpy.mockResolvedValueOnce(jsonResponse(first))
    fetchSpy.mockResolvedValueOnce(jsonResponse(second))
    const store = useFitnessProgramStore()

    await store.submitProgram()
    await store.submitProgram()

    expect(store.program?.program_id).toBe('prog-second')
  })

  it('submitProgram clears a previous error before each call', async () => {
    fetchSpy.mockResolvedValueOnce(new Response('Server Error', { status: 500 }))
    fetchSpy.mockResolvedValueOnce(jsonResponse(PROGRAM_PAYLOAD))
    const store = useFitnessProgramStore()

    await store.submitProgram()
    expect(store.error?.status).toBe(500)

    await store.submitProgram()
    expect(store.error).toBeNull()
    expect(store.program).toEqual(PROGRAM_PAYLOAD)
  })

  it('clearError resets the error state', async () => {
    fetchSpy.mockResolvedValueOnce(new Response('Server Error', { status: 502 }))
    const store = useFitnessProgramStore()

    await store.submitProgram()
    expect(store.error?.status).toBe(502)

    store.clearError()
    expect(store.error).toBeNull()
  })
})
