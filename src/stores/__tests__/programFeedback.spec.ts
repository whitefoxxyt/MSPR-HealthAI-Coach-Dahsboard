import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useProgramFeedbackStore } from '../programFeedback'

const AUTH_STORAGE_KEY = 'healthai.auth.session'

function jsonResponse(payload: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
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

const FEEDBACK_BODY = {
  score: 4,
  completed: true,
  comment: 'Bon programme',
  exercise_id: null,
}

const FEEDBACK_RESPONSE = {
  user_id: 'user-1',
  program_id: 'prog-abc-123',
  feedback_score: 4,
  completed: true,
  comment: 'Bon programme',
  exercise_id: null,
  created_at: '2026-05-22T13:00:00Z',
}

const PAGE = {
  items: [
    {
      program_id: 'prog-abc-123',
      user_id: 'user-1',
      feedback_score: 4,
      created_at: '2026-05-22T13:00:00Z',
    },
  ],
  total: 1,
  limit: 20,
  offset: 0,
}

describe('useProgramFeedbackStore', () => {
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
    const store = useProgramFeedbackStore()

    expect(store.list).toEqual([])
    expect(store.total).toBe(0)
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
    expect(store.lastSubmitted).toBeNull()
  })

  it('submit sets lastSubmitted on success and clears any previous error', async () => {
    fetchSpy.mockResolvedValueOnce(new Response('Server Error', { status: 500 }))
    fetchSpy.mockResolvedValueOnce(jsonResponse(FEEDBACK_RESPONSE))
    const store = useProgramFeedbackStore()

    await store.submit('prog-abc-123', FEEDBACK_BODY)
    expect(store.error?.status).toBe(500)

    await store.submit('prog-abc-123', FEEDBACK_BODY)

    expect(store.lastSubmitted).toEqual(FEEDBACK_RESPONSE)
    expect(store.error).toBeNull()
    expect(store.loading).toBe(false)
  })

  it('submit captures ApiError with retryAfter on 429', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response('Too Many Requests', {
        status: 429,
        headers: { 'Retry-After': '12' },
      }),
    )
    const store = useProgramFeedbackStore()

    await store.submit('prog-abc-123', FEEDBACK_BODY)

    expect(store.error?.status).toBe(429)
    expect(store.error?.retryAfter).toBe(12)
    expect(store.lastSubmitted).toBeNull()
    expect(store.loading).toBe(false)
  })

  it('submit captures ApiError on 5xx', async () => {
    fetchSpy.mockResolvedValueOnce(new Response('Server Error', { status: 503 }))
    const store = useProgramFeedbackStore()

    await store.submit('prog-abc-123', FEEDBACK_BODY)

    expect(store.error?.status).toBe(503)
    expect(store.lastSubmitted).toBeNull()
  })

  it('loadHistory populates list and total on success', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse(PAGE))
    const store = useProgramFeedbackStore()

    await store.loadHistory()

    expect(store.list).toEqual(PAGE.items)
    expect(store.total).toBe(PAGE.total)
    expect(store.error).toBeNull()
    expect(store.loading).toBe(false)
  })

  it('loadHistory captures errors and leaves list untouched', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse(PAGE))
    const store = useProgramFeedbackStore()
    await store.loadHistory()

    fetchSpy.mockResolvedValueOnce(new Response('Server Error', { status: 502 }))
    await store.loadHistory()

    expect(store.error?.status).toBe(502)
    expect(store.list).toEqual(PAGE.items)
  })

  it('clearError resets the error state', async () => {
    fetchSpy.mockResolvedValueOnce(new Response('Server Error', { status: 500 }))
    const store = useProgramFeedbackStore()

    await store.submit('prog-abc-123', FEEDBACK_BODY)
    expect(store.error).not.toBeNull()

    store.clearError()
    expect(store.error).toBeNull()
  })

  it('clearLastSubmitted resets the success marker (consumed by toast dismiss)', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse(FEEDBACK_RESPONSE))
    const store = useProgramFeedbackStore()

    await store.submit('prog-abc-123', FEEDBACK_BODY)
    expect(store.lastSubmitted).not.toBeNull()

    store.clearLastSubmitted()
    expect(store.lastSubmitted).toBeNull()
  })
})
