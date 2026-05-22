import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useMealAnalysisStore } from '../mealAnalysis'

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

function pngFile(name = 'meal.png'): File {
  return new File([new Uint8Array(2048)], name, { type: 'image/png' })
}

const ANALYSIS_PAYLOAD = {
  detected_foods: [
    { name: 'Saumon grillé', confidence: 0.88 },
    { name: 'Riz basmati', confidence: 0.75 },
  ],
  macros: {
    calories: 540,
    protein_g: 38,
    carbs_g: 52,
    fat_g: 18,
    fiber_g: 4,
  },
  insight: 'Bon équilibre protéique. Ajoute des légumes verts pour la suite.',
  llm_backend_used: 'ollama',
}

describe('useMealAnalysisStore', () => {
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
    const store = useMealAnalysisStore()

    expect(store.analysis).toBeNull()
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
    expect(store.lastSubmittedFile).toBeNull()
    expect(store.retryAfter).toBeNull()
  })

  it('submitMeal populates analysis on success', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse(ANALYSIS_PAYLOAD))
    const store = useMealAnalysisStore()
    const file = pngFile()

    await store.submitMeal(file, 'lunch')

    expect(store.analysis).toEqual(ANALYSIS_PAYLOAD)
    expect(store.lastSubmittedFile).toBe(file)
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('submitMeal sets loading=true during the request', async () => {
    let resolveFetch: (response: Response) => void = () => {}
    fetchSpy.mockImplementationOnce(
      () => new Promise<Response>((resolve) => { resolveFetch = resolve })
    )
    const store = useMealAnalysisStore()

    const pending = store.submitMeal(pngFile())
    expect(store.loading).toBe(true)

    resolveFetch(jsonResponse(ANALYSIS_PAYLOAD))
    await pending

    expect(store.loading).toBe(false)
  })

  it('submitMeal captures ApiError on 5xx', async () => {
    fetchSpy.mockResolvedValueOnce(new Response('Server Error', { status: 503 }))
    const store = useMealAnalysisStore()

    await store.submitMeal(pngFile())

    expect(store.error).not.toBeNull()
    expect(store.error?.status).toBe(503)
    expect(store.analysis).toBeNull()
  })

  it('submitMeal stores retryAfter on 429', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response('Too Many Requests', {
        status: 429,
        headers: { 'Retry-After': '30' },
      }),
    )
    const store = useMealAnalysisStore()

    await store.submitMeal(pngFile())

    expect(store.error?.status).toBe(429)
    expect(store.retryAfter).toBe(30)
  })

  it('submitMeal clears the previous error on retry', async () => {
    fetchSpy.mockResolvedValueOnce(new Response('Server Error', { status: 500 }))
    fetchSpy.mockResolvedValueOnce(jsonResponse(ANALYSIS_PAYLOAD))
    const store = useMealAnalysisStore()

    await store.submitMeal(pngFile())
    expect(store.error?.status).toBe(500)

    await store.submitMeal(pngFile())
    expect(store.error).toBeNull()
    expect(store.analysis).toEqual(ANALYSIS_PAYLOAD)
  })

  it('reset() clears the analysis, error, retryAfter and lastSubmittedFile', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse(ANALYSIS_PAYLOAD))
    const store = useMealAnalysisStore()
    await store.submitMeal(pngFile())

    store.reset()

    expect(store.analysis).toBeNull()
    expect(store.lastSubmittedFile).toBeNull()
    expect(store.error).toBeNull()
    expect(store.retryAfter).toBeNull()
  })

  it('submitMeal forwards meal_type to the API', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse(ANALYSIS_PAYLOAD))
    const store = useMealAnalysisStore()

    await store.submitMeal(pngFile(), 'dinner')

    const init = fetchSpy.mock.calls[0]![1] as RequestInit
    const body = init.body as FormData
    expect(body.get('meal_type')).toBe('dinner')
  })
})
