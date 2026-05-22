import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useFitnessProfileStore } from '../fitnessProfile'

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

const PROFILE_PAYLOAD = {
  user_id: 'user-1',
  health_goal_fitness: 'muscle_strength',
  experience_level: 'intermediate',
  equipment: ['dumbbell', 'bench'],
  limitations: [],
  preferences: { duration_min_per_session: 60, sessions_per_week: 4 },
  updated_at: '2026-05-22T12:00:00Z',
}

describe('useFitnessProfileStore', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    setActivePinia(createPinia())
    seedAuthSession()
    fetchSpy = vi.spyOn(globalThis, 'fetch')
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-22T10:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
    fetchSpy.mockRestore()
    localStorage.removeItem(AUTH_STORAGE_KEY)
  })

  it('initialises with empty state', () => {
    const store = useFitnessProfileStore()

    expect(store.profile).toBeNull()
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('fetchProfile populates profile on success', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse(PROFILE_PAYLOAD))
    const store = useFitnessProfileStore()

    await store.fetchProfile()

    expect(store.profile).toEqual(PROFILE_PAYLOAD)
    expect(store.error).toBeNull()
    expect(store.loading).toBe(false)
  })

  it('fetchProfile leaves profile null when backend responds 404', async () => {
    fetchSpy.mockResolvedValueOnce(new Response('Not Found', { status: 404 }))
    const store = useFitnessProfileStore()

    await store.fetchProfile()

    expect(store.profile).toBeNull()
    expect(store.error).toBeNull()
  })

  it('fetchProfile captures ApiError with retryAfter on 429', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response('Too Many Requests', {
        status: 429,
        headers: { 'Retry-After': '15' },
      }),
    )
    const store = useFitnessProfileStore()

    await store.fetchProfile()

    expect(store.error?.status).toBe(429)
    expect(store.error?.retryAfter).toBe(15)
  })

  it('fetchProfile skips the request within the 60s TTL window', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse(PROFILE_PAYLOAD))
    const store = useFitnessProfileStore()

    await store.fetchProfile()
    vi.advanceTimersByTime(30_000)
    await store.fetchProfile()

    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('updateProfile issues PUT and updates local state', async () => {
    const updated = {
      ...PROFILE_PAYLOAD,
      health_goal_fitness: 'endurance',
      experience_level: 'beginner',
    }
    fetchSpy.mockResolvedValueOnce(jsonResponse(updated))
    const store = useFitnessProfileStore()

    await store.updateProfile({
      health_goal_fitness: 'endurance',
      experience_level: 'beginner',
      equipment: [],
      limitations: ['knee'],
      preferences: { duration_min_per_session: 30, sessions_per_week: 3 },
    })

    expect(store.profile).toEqual(updated)
  })

  it('updateProfile captures ApiError without overwriting profile', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse(PROFILE_PAYLOAD))
    fetchSpy.mockResolvedValueOnce(new Response('Server Error', { status: 500 }))
    const store = useFitnessProfileStore()

    await store.fetchProfile()
    await store.updateProfile({
      health_goal_fitness: 'endurance',
      experience_level: 'beginner',
      equipment: [],
      limitations: [],
      preferences: { duration_min_per_session: 30, sessions_per_week: 3 },
    })

    expect(store.profile).toEqual(PROFILE_PAYLOAD)
    expect(store.error?.status).toBe(500)
  })
})
