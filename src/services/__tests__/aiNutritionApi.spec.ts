import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { nutritionGoalsApi, nutritionMacrosApi } from '../aiNutritionApi'

const AUTH_STORAGE_KEY = 'healthai.auth.session'

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function seedAuthSession(token = 'jwt-test-token') {
  localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({
      user: { id: 'user-1', username: 'arthur', email: 'arthur@healthai.test', role: 'user' },
      tokens: {
        accessToken: token,
        refreshToken: 'refresh-token',
        expiresAt: '2099-01-01T00:00:00.000Z',
      },
    }),
  )
}

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
