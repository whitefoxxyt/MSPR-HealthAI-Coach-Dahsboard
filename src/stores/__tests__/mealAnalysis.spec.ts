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

  describe('history', () => {
    function historyItem(id: string, overrides: Partial<Record<string, unknown>> = {}) {
      return {
        id,
        created_at: '2026-05-20T12:00:00Z',
        meal_type: 'lunch',
        image_url: `http://files.local/${id}.png`,
        detected_foods: [{ name: 'Riz', confidence: 0.8 }],
        macros: { calories: 500, protein_g: 25, carbs_g: 60, fat_g: 15, fiber_g: 4 },
        insight: `Insight ${id}`,
        llm_backend_used: 'mistral',
        ...overrides,
      }
    }

    function historyPage(items: ReturnType<typeof historyItem>[], total: number, limit: number, offset: number) {
      return { items, total, limit, offset }
    }

    it('initialises with empty history state', () => {
      const store = useMealAnalysisStore()

      expect(store.history).toEqual([])
      expect(store.historyTotal).toBe(0)
      expect(store.historyLoading).toBe(false)
      expect(store.historyError).toBeNull()
    })

    it('loadHistory(10, 0) populates history and total on success', async () => {
      const payload = historyPage([historyItem('a'), historyItem('b')], 5, 10, 0)
      fetchSpy.mockResolvedValueOnce(jsonResponse(payload))
      const store = useMealAnalysisStore()

      await store.loadHistory(10, 0)

      expect(store.history).toHaveLength(2)
      expect(store.history[0]?.id).toBe('a')
      expect(store.historyTotal).toBe(5)
      expect(store.historyLoading).toBe(false)
      expect(store.historyError).toBeNull()
    })

    it('loadHistory(10, 0) replaces previous items', async () => {
      fetchSpy.mockResolvedValueOnce(
        jsonResponse(historyPage([historyItem('old')], 1, 10, 0)),
      )
      const store = useMealAnalysisStore()
      await store.loadHistory(10, 0)

      fetchSpy.mockResolvedValueOnce(
        jsonResponse(historyPage([historyItem('new')], 1, 10, 0)),
      )
      vi.useFakeTimers({ shouldAdvanceTime: true })
      vi.advanceTimersByTime(31_000)
      await store.loadHistory(10, 0)
      vi.useRealTimers()

      expect(store.history).toHaveLength(1)
      expect(store.history[0]?.id).toBe('new')
    })

    it('loadHistory with offset > 0 appends items for pagination', async () => {
      fetchSpy.mockResolvedValueOnce(
        jsonResponse(historyPage([historyItem('a'), historyItem('b')], 4, 2, 0)),
      )
      const store = useMealAnalysisStore()
      await store.loadHistory(2, 0)

      fetchSpy.mockResolvedValueOnce(
        jsonResponse(historyPage([historyItem('c'), historyItem('d')], 4, 2, 2)),
      )
      await store.loadHistory(2, 2)

      expect(store.history.map((i) => i.id)).toEqual(['a', 'b', 'c', 'd'])
      expect(store.historyTotal).toBe(4)
    })

    it('loadHistory(limit, 0) reuses the cache within 30s and skips the network', async () => {
      fetchSpy.mockResolvedValueOnce(
        jsonResponse(historyPage([historyItem('a')], 1, 10, 0)),
      )
      const store = useMealAnalysisStore()
      await store.loadHistory(10, 0)
      expect(fetchSpy).toHaveBeenCalledTimes(1)

      await store.loadHistory(10, 0)

      expect(fetchSpy).toHaveBeenCalledTimes(1)
      expect(store.history).toHaveLength(1)
    })

    it('loadHistory(limit, 0) refetches after the 30s TTL expires', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true })
      fetchSpy.mockResolvedValueOnce(
        jsonResponse(historyPage([historyItem('a')], 1, 10, 0)),
      )
      const store = useMealAnalysisStore()
      await store.loadHistory(10, 0)

      vi.advanceTimersByTime(31_000)
      fetchSpy.mockResolvedValueOnce(
        jsonResponse(historyPage([historyItem('b')], 1, 10, 0)),
      )
      await store.loadHistory(10, 0)
      vi.useRealTimers()

      expect(fetchSpy).toHaveBeenCalledTimes(2)
      expect(store.history[0]?.id).toBe('b')
    })

    it('loadHistory with offset > 0 always hits the network (bypasses cache)', async () => {
      fetchSpy.mockResolvedValueOnce(
        jsonResponse(historyPage([historyItem('a')], 4, 1, 0)),
      )
      const store = useMealAnalysisStore()
      await store.loadHistory(1, 0)
      expect(fetchSpy).toHaveBeenCalledTimes(1)

      fetchSpy.mockResolvedValueOnce(
        jsonResponse(historyPage([historyItem('b')], 4, 1, 1)),
      )
      await store.loadHistory(1, 1)

      expect(fetchSpy).toHaveBeenCalledTimes(2)
    })

    it('loadHistory captures ApiError on 5xx', async () => {
      fetchSpy.mockResolvedValueOnce(new Response('Server Error', { status: 503 }))
      const store = useMealAnalysisStore()

      await store.loadHistory(10, 0)

      expect(store.historyError).not.toBeNull()
      expect(store.historyError?.status).toBe(503)
      expect(store.historyLoading).toBe(false)
    })

    it('loadHistory clears the previous error on retry', async () => {
      fetchSpy.mockResolvedValueOnce(new Response('Server Error', { status: 500 }))
      const store = useMealAnalysisStore()
      await store.loadHistory(10, 0)
      expect(store.historyError?.status).toBe(500)

      fetchSpy.mockResolvedValueOnce(
        jsonResponse(historyPage([historyItem('a')], 1, 10, 0)),
      )
      await store.loadHistory(10, 0)

      expect(store.historyError).toBeNull()
      expect(store.history).toHaveLength(1)
    })

    it('loadHistory sets historyLoading=true during the request', async () => {
      let resolveFetch: (response: Response) => void = () => {}
      fetchSpy.mockImplementationOnce(
        () => new Promise<Response>((resolve) => { resolveFetch = resolve }),
      )
      const store = useMealAnalysisStore()

      const pending = store.loadHistory(10, 0)
      expect(store.historyLoading).toBe(true)

      resolveFetch(jsonResponse(historyPage([historyItem('a')], 1, 10, 0)))
      await pending

      expect(store.historyLoading).toBe(false)
    })
  })
})
