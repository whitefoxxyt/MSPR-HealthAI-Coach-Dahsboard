import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useMealPlanStore, MEAL_PLAN_TIMEOUTS_MS } from '../mealPlan'
import { useLLMPreferencesStore } from '../llmPreferences'

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

const SAMPLE_MEAL = {
  name: 'Porridge banane',
  macros: { calories: 420, protein_g: 18, carbs_g: 68, fat_g: 9 },
  ingredients: ['flocons avoine', 'banane', 'lait'],
  budget_eur: 1.8,
  prep_time_min: 10,
}

const SAMPLE_PLAN = {
  days: [
    {
      day: 1,
      breakfast: SAMPLE_MEAL,
      lunch: { ...SAMPLE_MEAL, name: 'Bowl quinoa' },
      dinner: { ...SAMPLE_MEAL, name: 'Saumon vapeur' },
    },
  ],
  llm_backend_used: 'ollama',
  total_budget_eur: 18.5,
}

const SAMPLE_BODY = {
  diet_type: 'omnivore' as const,
  duration_days: 1,
  allergies: [],
}

describe('useMealPlanStore', () => {
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

  it('exposes Ollama (5 min) and Mistral (30 s) timeouts', () => {
    expect(MEAL_PLAN_TIMEOUTS_MS.ollama).toBe(5 * 60 * 1000)
    expect(MEAL_PLAN_TIMEOUTS_MS.mistral).toBe(30 * 1000)
  })

  it('initialises with empty state', () => {
    const store = useMealPlanStore()

    expect(store.currentPlan).toBeNull()
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('submitPlan stores the generated plan and clears loading', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse(SAMPLE_PLAN))
    const store = useMealPlanStore()

    await store.submitPlan(SAMPLE_BODY)

    expect(store.currentPlan).toEqual(SAMPLE_PLAN)
    expect(store.error).toBeNull()
    expect(store.loading).toBe(false)
  })

  it('submitPlan POSTs to /api/v1/generate-meal-plan with the body', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse(SAMPLE_PLAN))
    const store = useMealPlanStore()

    await store.submitPlan({
      health_goal: 'muscle_gain',
      diet_type: 'omnivore',
      duration_days: 5,
      allergies: ['gluten'],
      budget_eur_per_day: 15,
    })

    const call = fetchSpy.mock.calls[0]
    expect(call[0]).toBe('http://localhost:8001/api/v1/generate-meal-plan')
    expect((call[1] as RequestInit).method).toBe('POST')
    const sent = JSON.parse((call[1] as RequestInit).body as string)
    expect(sent).toEqual({
      health_goal: 'muscle_gain',
      diet_type: 'omnivore',
      duration_days: 5,
      allergies: ['gluten'],
      budget_eur_per_day: 15,
    })
  })

  it('submitPlan captures ApiError with retryAfter on 429', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response('Too Many Requests', {
        status: 429,
        headers: { 'Retry-After': '60' },
      }),
    )
    const store = useMealPlanStore()

    await store.submitPlan(SAMPLE_BODY)

    expect(store.error?.status).toBe(429)
    expect(store.error?.retryAfter).toBe(60)
    expect(store.currentPlan).toBeNull()
    expect(store.loading).toBe(false)
  })

  it('submitPlan captures ApiError on 5xx without overwriting a prior plan', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse(SAMPLE_PLAN))
    fetchSpy.mockResolvedValueOnce(new Response('Server Error', { status: 503 }))
    const store = useMealPlanStore()

    await store.submitPlan(SAMPLE_BODY)
    await store.submitPlan(SAMPLE_BODY)

    expect(store.currentPlan).toEqual(SAMPLE_PLAN)
    expect(store.error?.status).toBe(503)
  })

  it('clears the error when submitPlan is retried successfully', async () => {
    fetchSpy.mockResolvedValueOnce(new Response('Server Error', { status: 500 }))
    fetchSpy.mockResolvedValueOnce(jsonResponse(SAMPLE_PLAN))
    const store = useMealPlanStore()

    await store.submitPlan(SAMPLE_BODY)
    expect(store.error).not.toBeNull()

    await store.submitPlan(SAMPLE_BODY)
    expect(store.error).toBeNull()
    expect(store.currentPlan).toEqual(SAMPLE_PLAN)
  })

  it('uses the 30s Mistral timeout when the effective backend is mistral', async () => {
    const llmStore = useLLMPreferencesStore()
    llmStore.$patch({ effectiveLlm: 'mistral' })
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout')
    fetchSpy.mockResolvedValueOnce(jsonResponse(SAMPLE_PLAN))
    const store = useMealPlanStore()

    await store.submitPlan(SAMPLE_BODY)

    const delays = setTimeoutSpy.mock.calls.map((args) => args[1])
    expect(delays).toContain(30 * 1000)
    setTimeoutSpy.mockRestore()
  })

  it('uses the 5min Ollama timeout when the effective backend is ollama', async () => {
    const llmStore = useLLMPreferencesStore()
    llmStore.$patch({ effectiveLlm: 'ollama' })
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout')
    fetchSpy.mockResolvedValueOnce(jsonResponse(SAMPLE_PLAN))
    const store = useMealPlanStore()

    await store.submitPlan(SAMPLE_BODY)

    const delays = setTimeoutSpy.mock.calls.map((args) => args[1])
    expect(delays).toContain(5 * 60 * 1000)
    setTimeoutSpy.mockRestore()
  })

  it('captures a timeout error when fetch is aborted', async () => {
    fetchSpy.mockImplementationOnce(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          const signal = (init as RequestInit | undefined)?.signal
          signal?.addEventListener('abort', () => {
            const err = new Error('aborted')
            err.name = 'AbortError'
            reject(err)
          })
        }),
    )
    const store = useMealPlanStore()

    const inflight = store.submitPlan(SAMPLE_BODY)

    // Force-trigger the abort to simulate timeout firing.
    store.abort()
    await inflight

    expect(store.error).not.toBeNull()
    expect(store.error?.status).toBe(408)
    expect(store.loading).toBe(false)
  })

  it('reset() clears state back to initial', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse(SAMPLE_PLAN))
    const store = useMealPlanStore()
    await store.submitPlan(SAMPLE_BODY)
    expect(store.currentPlan).not.toBeNull()

    store.reset()

    expect(store.currentPlan).toBeNull()
    expect(store.error).toBeNull()
    expect(store.loading).toBe(false)
  })
})
