import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  llmPreferencesApi,
  mealAnalysisApi,
  nutritionGoalsApi,
  nutritionMacrosApi,
} from '../aiNutritionApi'

const AUTH_STORAGE_KEY = 'healthai.auth.session'
const EXPECTED_URL = 'http://localhost:8001/api/v1/me/preferences'

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
      user: { id: 'u-1', username: 'arthur', email: 'arthur@test.dev', role: 'user' },
      tokens: {
        accessToken: 'jwt-test-token',
        refreshToken: 'refresh',
        expiresAt: '2099-01-01T00:00:00.000Z',
      },
    }),
  )
}

describe('llmPreferencesApi', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    seedAuthSession()
    fetchSpy = vi.spyOn(globalThis, 'fetch')
  })

  afterEach(() => {
    fetchSpy.mockRestore()
    localStorage.removeItem(AUTH_STORAGE_KEY)
  })

  it('GET appelle /api/v1/me/preferences avec Authorization Bearer', async () => {
    fetchSpy.mockResolvedValueOnce(
      jsonResponse({ preferred_llm: null, effective_llm: 'mistral' }),
    )

    await llmPreferencesApi.getPreferences()

    expect(fetchSpy).toHaveBeenCalledWith(
      EXPECTED_URL,
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({ Authorization: 'Bearer jwt-test-token' }),
      }),
    )
  })

  it('PATCH appelle /api/v1/me/preferences avec le backend choisi', async () => {
    fetchSpy.mockResolvedValueOnce(
      jsonResponse({ preferred_llm: 'ollama', effective_llm: 'ollama' }),
    )

    await llmPreferencesApi.updatePreferences('ollama')

    expect(fetchSpy).toHaveBeenCalledWith(
      EXPECTED_URL,
      expect.objectContaining({
        method: 'PATCH',
        headers: expect.objectContaining({
          Authorization: 'Bearer jwt-test-token',
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ preferred_llm: 'ollama' }),
      }),
    )
  })

  it("propage une erreur HTTP en exception explicite", async () => {
    fetchSpy.mockResolvedValueOnce(new Response('boom', { status: 500 }))

    await expect(llmPreferencesApi.getPreferences()).rejects.toThrow(/500/)
  })
})

describe('nutritionGoalsApi', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    seedAuthSession()
    fetchSpy = vi.spyOn(globalThis, 'fetch')
  })

  afterEach(() => {
    fetchSpy.mockRestore()
    localStorage.removeItem(AUTH_STORAGE_KEY)
  })

  describe('getNutritionGoals', () => {
    it('issues GET /api/v1/nutrition-goals/me with bearer auth and returns the goals', async () => {
      const payload = {
        user_id: 'user-1',
        health_goal: 'muscle_gain',
        calories_target: 2400,
        protein_g: '140.0',
        carbs_g: '260.0',
        fat_g: '80.0',
        allergies: ['arachides'],
        diet_type: 'omnivore',
      }
      fetchSpy.mockResolvedValueOnce(jsonResponse(payload))

      const result = await nutritionGoalsApi.getNutritionGoals()

      expect(fetchSpy).toHaveBeenCalledWith(
        'http://localhost:8001/api/v1/nutrition-goals/me',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({ Authorization: 'Bearer jwt-test-token' }),
        }),
      )
      expect(result).toEqual(payload)
    })

    it('returns null when the backend responds 404 (no goals configured yet)', async () => {
      fetchSpy.mockResolvedValueOnce(new Response('Not Found', { status: 404 }))

      await expect(nutritionGoalsApi.getNutritionGoals()).resolves.toBeNull()
    })

    it('throws ApiError with retryAfter on 429', async () => {
      fetchSpy.mockResolvedValueOnce(
        new Response('Too Many Requests', {
          status: 429,
          headers: { 'Retry-After': '20' },
        }),
      )

      await expect(nutritionGoalsApi.getNutritionGoals()).rejects.toMatchObject({
        status: 429,
        retryAfter: 20,
      })
    })
  })

  describe('updateNutritionGoals', () => {
    it('issues PUT /api/v1/nutrition-goals/me with the JSON body', async () => {
      const body = {
        health_goal: 'weight_loss' as const,
        calories_target: 1700,
        protein_g: 90,
        carbs_g: 170,
        fat_g: 55,
        allergies: [] as string[],
        diet_type: 'vegetarien' as const,
      }
      const response = {
        user_id: 'user-1',
        health_goal: 'weight_loss',
        calories_target: 1700,
        protein_g: '90.0',
        carbs_g: '170.0',
        fat_g: '55.0',
        allergies: [],
        diet_type: 'vegetarien',
      }
      fetchSpy.mockResolvedValueOnce(jsonResponse(response))

      const result = await nutritionGoalsApi.updateNutritionGoals(body)

      expect(fetchSpy).toHaveBeenCalledWith(
        'http://localhost:8001/api/v1/nutrition-goals/me',
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            Authorization: 'Bearer jwt-test-token',
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(body),
        }),
      )
      expect(result).toEqual(response)
    })
  })
})

describe('mealAnalysisApi', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    seedAuthSession()
    fetchSpy = vi.spyOn(globalThis, 'fetch')
  })

  afterEach(() => {
    fetchSpy.mockRestore()
    localStorage.removeItem(AUTH_STORAGE_KEY)
  })

  const ANALYZE_URL = 'http://localhost:8001/api/v1/analyze-meal'

  const ANALYZE_PAYLOAD = {
    detected_foods: [
      { name: 'Pizza margherita', confidence: 0.92 },
      { name: 'Salade verte', confidence: 0.68 },
    ],
    macros: {
      calories: 720,
      protein_g: 28,
      carbs_g: 82,
      fat_g: 30,
      fiber_g: 6,
    },
    insight: 'Pense à ajouter une portion de légumes verts pour booster les fibres.',
    llm_backend_used: 'mistral',
  }

  function pngFile(name = 'meal.png', size = 1024): File {
    return new File([new Uint8Array(size)], name, { type: 'image/png' })
  }

  it('POST /api/v1/analyze-meal en multipart avec bearer auth', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse(ANALYZE_PAYLOAD))

    const file = pngFile()
    const result = await mealAnalysisApi.analyzeMeal(file)

    const [calledUrl, init] = fetchSpy.mock.calls[0] as [string, RequestInit]
    expect(calledUrl).toBe(ANALYZE_URL)
    expect(init.method).toBe('POST')
    const headers = init.headers as Record<string, string>
    expect(headers.Authorization).toBe('Bearer jwt-test-token')
    expect(headers['Content-Type']).toBeUndefined()
    expect(init.body).toBeInstanceOf(FormData)
    const body = init.body as FormData
    expect(body.get('file')).toBeInstanceOf(File)
    expect((body.get('file') as File).name).toBe('meal.png')
    expect(result).toEqual(ANALYZE_PAYLOAD)
  })

  it('ajoute meal_type dans le FormData quand fourni', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse(ANALYZE_PAYLOAD))

    await mealAnalysisApi.analyzeMeal(pngFile(), 'lunch')

    const init = fetchSpy.mock.calls[0]![1] as RequestInit
    const body = init.body as FormData
    expect(body.get('meal_type')).toBe('lunch')
  })

  it('omet meal_type du FormData quand non fourni', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse(ANALYZE_PAYLOAD))

    await mealAnalysisApi.analyzeMeal(pngFile())

    const init = fetchSpy.mock.calls[0]![1] as RequestInit
    const body = init.body as FormData
    expect(body.has('meal_type')).toBe(false)
  })

  it('lance ApiError avec retryAfter sur 429', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response('Too Many Requests', {
        status: 429,
        headers: { 'Retry-After': '45' },
      }),
    )

    await expect(mealAnalysisApi.analyzeMeal(pngFile())).rejects.toMatchObject({
      status: 429,
      retryAfter: 45,
    })
  })

  it('propage une erreur 5xx en ApiError', async () => {
    fetchSpy.mockResolvedValueOnce(new Response('Bad Gateway', { status: 502 }))

    await expect(mealAnalysisApi.analyzeMeal(pngFile())).rejects.toMatchObject({
      status: 502,
    })
  })
})

describe('nutritionMacrosApi', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    seedAuthSession()
    fetchSpy = vi.spyOn(globalThis, 'fetch')
  })

  afterEach(() => {
    fetchSpy.mockRestore()
    localStorage.removeItem(AUTH_STORAGE_KEY)
  })

  describe('getMacros', () => {
    it('issues GET /api/v1/me/macros with bearer auth and returns the macros', async () => {
      const payload = {
        profile_completion_required: false,
        missing_fields: [],
        tdee: 2450,
        macros: { calories: 2450, protein_g: 184, carbs_g: 276, fat_g: 68 },
      }
      fetchSpy.mockResolvedValueOnce(jsonResponse(payload))

      const result = await nutritionMacrosApi.getMacros()

      expect(fetchSpy).toHaveBeenCalledWith(
        'http://localhost:8001/api/v1/me/macros',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({ Authorization: 'Bearer jwt-test-token' }),
        }),
      )
      expect(result).toEqual(payload)
    })

    it('returns the incomplete-profile payload with missing fields', async () => {
      const payload = {
        profile_completion_required: true,
        missing_fields: ['weight_kg', 'height_cm'],
        tdee: null,
        macros: null,
      }
      fetchSpy.mockResolvedValueOnce(jsonResponse(payload))

      const result = await nutritionMacrosApi.getMacros()

      expect(result.profile_completion_required).toBe(true)
      expect(result.missing_fields).toEqual(['weight_kg', 'height_cm'])
      expect(result.tdee).toBeNull()
      expect(result.macros).toBeNull()
    })
  })
})
