import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { recoFitnessApi } from '../recoFitnessApi'

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

describe('recoFitnessApi', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    seedAuthSession()
    fetchSpy = vi.spyOn(globalThis, 'fetch')
  })

  afterEach(() => {
    fetchSpy.mockRestore()
    localStorage.removeItem(AUTH_STORAGE_KEY)
  })

  describe('getFitnessProfile', () => {
    it('issues GET /api/v1/fitness-profile/me with bearer auth and returns the profile', async () => {
      const profilePayload = {
        user_id: 'user-1',
        health_goal_fitness: 'muscle_strength',
        experience_level: 'intermediate',
        equipment: ['dumbbell', 'bench'],
        limitations: [],
        preferences: { duration_min_per_session: 60, sessions_per_week: 4 },
        updated_at: '2026-05-22T12:00:00Z',
      }
      fetchSpy.mockResolvedValueOnce(jsonResponse(profilePayload))

      const result = await recoFitnessApi.getFitnessProfile()

      expect(fetchSpy).toHaveBeenCalledWith(
        'http://localhost:8002/api/v1/fitness-profile/me',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({ Authorization: 'Bearer jwt-test-token' }),
        }),
      )
      expect(result).toEqual(profilePayload)
    })

    it('returns null when the backend responds 404 (no profile yet)', async () => {
      fetchSpy.mockResolvedValueOnce(new Response('Not Found', { status: 404 }))

      await expect(recoFitnessApi.getFitnessProfile()).resolves.toBeNull()
    })

    it('throws ApiError with status code on 401', async () => {
      fetchSpy.mockResolvedValueOnce(new Response('Unauthorized', { status: 401 }))

      await expect(recoFitnessApi.getFitnessProfile()).rejects.toMatchObject({
        status: 401,
      })
    })

    it('throws ApiError with status code and retryAfter on 429', async () => {
      fetchSpy.mockResolvedValueOnce(
        new Response('Too Many Requests', {
          status: 429,
          headers: { 'Retry-After': '30' },
        }),
      )

      await expect(recoFitnessApi.getFitnessProfile()).rejects.toMatchObject({
        status: 429,
        retryAfter: 30,
      })
    })
  })

  describe('generateProgram', () => {
    const PROGRAM_PAYLOAD = {
      program_id: 'prog-123',
      user_id: 'user-1',
      duration_weeks: 4,
      scoring_strategy: 'hybrid_rank_fusion' as const,
      tier_at_generation: 'premium' as const,
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

    it('issues POST /api/v1/recommendations with an empty JSON body and bearer auth', async () => {
      fetchSpy.mockResolvedValueOnce(jsonResponse(PROGRAM_PAYLOAD))

      const result = await recoFitnessApi.generateProgram()

      expect(fetchSpy).toHaveBeenCalledWith(
        'http://localhost:8002/api/v1/recommendations',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer jwt-test-token',
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({}),
        }),
      )
      expect(result).toEqual(PROGRAM_PAYLOAD)
    })

    it('throws ApiError with status 429 and retryAfter when the user hits the rate limit', async () => {
      fetchSpy.mockResolvedValueOnce(
        new Response('Too Many Requests', {
          status: 429,
          headers: { 'Retry-After': '20' },
        }),
      )

      await expect(recoFitnessApi.generateProgram()).rejects.toMatchObject({
        status: 429,
        retryAfter: 20,
      })
    })

    it('throws ApiError with status 409 when the catalog cannot produce any program', async () => {
      fetchSpy.mockResolvedValueOnce(new Response('No exercise passes filters', { status: 409 }))

      await expect(recoFitnessApi.generateProgram()).rejects.toMatchObject({
        status: 409,
      })
    })
  })

  describe('listPrograms', () => {
    const HISTORY_PAYLOAD = {
      items: [
        {
          program_id: 'prog-aaa',
          user_id: 'user-1',
          duration_weeks: 4,
          scoring_strategy: 'hybrid_rank_fusion' as const,
          tier_at_generation: 'premium' as const,
          health_goal_at_generation: 'muscle_strength' as const,
          duration_min_per_session: 60,
          weeks: [[[
            {
              id: 12,
              name: 'Bench Press',
              target_muscles: ['chest'],
              equipment: ['barbell'],
              difficulty: 'intermediate',
              category: 'compound',
            },
          ]]],
          created_at: '2026-05-22T12:00:00Z',
        },
      ],
      total: 1,
      limit: 10,
      offset: 0,
    }

    it('issues GET /api/v1/programs/me with limit + offset query params and bearer auth', async () => {
      fetchSpy.mockResolvedValueOnce(jsonResponse(HISTORY_PAYLOAD))

      const result = await recoFitnessApi.listPrograms(10, 0)

      expect(fetchSpy).toHaveBeenCalledWith(
        'http://localhost:8002/api/v1/programs/me?limit=10&offset=0',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({ Authorization: 'Bearer jwt-test-token' }),
        }),
      )
      expect(result).toEqual(HISTORY_PAYLOAD)
    })

    it('passes a non-zero offset for subsequent pages', async () => {
      fetchSpy.mockResolvedValueOnce(jsonResponse({ ...HISTORY_PAYLOAD, offset: 10 }))

      await recoFitnessApi.listPrograms(10, 10)

      expect(fetchSpy).toHaveBeenCalledWith(
        'http://localhost:8002/api/v1/programs/me?limit=10&offset=10',
        expect.anything(),
      )
    })

    it('throws ApiError with status 401 on unauthenticated calls', async () => {
      fetchSpy.mockResolvedValueOnce(new Response('Unauthorized', { status: 401 }))

      await expect(recoFitnessApi.listPrograms(10, 0)).rejects.toMatchObject({ status: 401 })
    })

    it('throws ApiError with retryAfter on 429', async () => {
      fetchSpy.mockResolvedValueOnce(
        new Response('Too Many Requests', {
          status: 429,
          headers: { 'Retry-After': '12' },
        }),
      )

      await expect(recoFitnessApi.listPrograms(10, 0)).rejects.toMatchObject({
        status: 429,
        retryAfter: 12,
      })
    })

    it('throws ApiError with status code on 5xx', async () => {
      fetchSpy.mockResolvedValueOnce(new Response('Bad Gateway', { status: 502 }))

      await expect(recoFitnessApi.listPrograms(10, 0)).rejects.toMatchObject({ status: 502 })
    })
  })

  describe('updateFitnessProfile', () => {
    it('issues PUT /api/v1/fitness-profile/me with the body serialised as JSON', async () => {
      const body = {
        health_goal_fitness: 'endurance' as const,
        experience_level: 'beginner' as const,
        equipment: [],
        limitations: ['knee'],
        preferences: { duration_min_per_session: 30, sessions_per_week: 3 },
      }
      const response = {
        user_id: 'user-1',
        ...body,
        updated_at: '2026-05-22T12:30:00Z',
      }
      fetchSpy.mockResolvedValueOnce(jsonResponse(response))

      const result = await recoFitnessApi.updateFitnessProfile(body)

      expect(fetchSpy).toHaveBeenCalledWith(
        'http://localhost:8002/api/v1/fitness-profile/me',
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

    it('throws ApiError with status code on 5xx', async () => {
      const body = {
        health_goal_fitness: 'endurance' as const,
        experience_level: 'beginner' as const,
        equipment: [],
        limitations: [],
        preferences: { duration_min_per_session: 30, sessions_per_week: 3 },
      }
      fetchSpy.mockResolvedValueOnce(new Response('Bad Gateway', { status: 502 }))

      await expect(recoFitnessApi.updateFitnessProfile(body)).rejects.toMatchObject({
        status: 502,
      })
    })
  })
})
