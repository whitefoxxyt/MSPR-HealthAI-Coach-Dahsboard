import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useNutritionGoalsStore } from '../nutritionGoals'

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

const GOALS_PAYLOAD = {
  user_id: 'user-1',
  health_goal: 'muscle_gain',
  calories_target: 2400,
  protein_g: '140.0',
  carbs_g: '260.0',
  fat_g: '80.0',
  allergies: ['arachides'],
  diet_type: 'omnivore',
}

const MACROS_PAYLOAD = {
  profile_completion_required: false,
  missing_fields: [],
  tdee: 2450,
  macros: { calories: 2450, protein_g: 184, carbs_g: 276, fat_g: 68 },
}

describe('useNutritionGoalsStore', () => {
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
    const store = useNutritionGoalsStore()

    expect(store.goals).toBeNull()
    expect(store.macros).toBeNull()
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('fetchGoals populates goals on success', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse(GOALS_PAYLOAD))
    const store = useNutritionGoalsStore()

    await store.fetchGoals()

    expect(store.goals).toEqual(GOALS_PAYLOAD)
    expect(store.error).toBeNull()
    expect(store.loading).toBe(false)
  })

  it('fetchGoals leaves goals null when backend responds 404 (no profile yet)', async () => {
    fetchSpy.mockResolvedValueOnce(new Response('Not Found', { status: 404 }))
    const store = useNutritionGoalsStore()

    await store.fetchGoals()

    expect(store.goals).toBeNull()
    expect(store.error).toBeNull()
  })

  it('fetchGoals captures ApiError on 5xx', async () => {
    fetchSpy.mockResolvedValueOnce(new Response('Server Error', { status: 500 }))
    const store = useNutritionGoalsStore()

    await store.fetchGoals()

    expect(store.error).not.toBeNull()
    expect(store.error?.status).toBe(500)
  })

  it('fetchGoals skips the request within the 60s TTL window', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse(GOALS_PAYLOAD))
    const store = useNutritionGoalsStore()

    await store.fetchGoals()
    expect(fetchSpy).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(30_000)
    await store.fetchGoals()

    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('fetchGoals refetches once the 60s TTL window has elapsed', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse(GOALS_PAYLOAD))
    fetchSpy.mockResolvedValueOnce(jsonResponse({ ...GOALS_PAYLOAD, calories_target: 2500 }))
    const store = useNutritionGoalsStore()

    await store.fetchGoals()
    vi.advanceTimersByTime(61_000)
    await store.fetchGoals()

    expect(fetchSpy).toHaveBeenCalledTimes(2)
    expect(store.goals?.calories_target).toBe(2500)
  })

  it('fetchGoals(true) forces a refetch regardless of TTL', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse(GOALS_PAYLOAD))
    fetchSpy.mockResolvedValueOnce(jsonResponse({ ...GOALS_PAYLOAD, calories_target: 2500 }))
    const store = useNutritionGoalsStore()

    await store.fetchGoals()
    await store.fetchGoals(true)

    expect(fetchSpy).toHaveBeenCalledTimes(2)
    expect(store.goals?.calories_target).toBe(2500)
  })

  it('updateGoals issues PUT and updates the local state', async () => {
    const updated = { ...GOALS_PAYLOAD, calories_target: 1800, health_goal: 'weight_loss' }
    fetchSpy.mockResolvedValueOnce(jsonResponse(updated))
    const store = useNutritionGoalsStore()

    await store.updateGoals({
      health_goal: 'weight_loss',
      calories_target: 1800,
      protein_g: 140,
      carbs_g: 200,
      fat_g: 70,
      allergies: [],
      diet_type: 'omnivore',
    })

    expect(store.goals).toEqual(updated)
    expect(fetchSpy).toHaveBeenCalledWith(
      'http://localhost:8001/api/v1/nutrition-goals/me',
      expect.objectContaining({ method: 'PUT' }),
    )
  })

  it('updateGoals invalidates the macros cache so the next fetchMacros refetches', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse(MACROS_PAYLOAD)) // initial macros
    fetchSpy.mockResolvedValueOnce(jsonResponse(GOALS_PAYLOAD)) // updateGoals
    fetchSpy.mockResolvedValueOnce(jsonResponse({ ...MACROS_PAYLOAD, tdee: 2600 })) // refetched macros
    const store = useNutritionGoalsStore()

    await store.fetchMacros()
    await store.updateGoals({
      health_goal: 'muscle_gain',
      calories_target: 2400,
      protein_g: 140,
      carbs_g: 260,
      fat_g: 80,
      allergies: [],
      diet_type: 'omnivore',
    })
    await store.fetchMacros()

    expect(fetchSpy).toHaveBeenCalledTimes(3)
    expect(store.macros?.tdee).toBe(2600)
  })

  it('updateGoals captures ApiError without overwriting goals', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse(GOALS_PAYLOAD))
    fetchSpy.mockResolvedValueOnce(new Response('Unauthorized', { status: 401 }))
    const store = useNutritionGoalsStore()

    await store.fetchGoals()
    await store.updateGoals({
      health_goal: 'weight_loss',
      calories_target: 1800,
      protein_g: 140,
      carbs_g: 200,
      fat_g: 70,
      allergies: [],
      diet_type: 'omnivore',
    })

    expect(store.goals).toEqual(GOALS_PAYLOAD)
    expect(store.error?.status).toBe(401)
  })

  it('fetchMacros honours its own 60s TTL', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse(MACROS_PAYLOAD))
    const store = useNutritionGoalsStore()

    await store.fetchMacros()
    vi.advanceTimersByTime(30_000)
    await store.fetchMacros()

    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('fetchMacros populates incomplete-profile state', async () => {
    fetchSpy.mockResolvedValueOnce(
      jsonResponse({
        profile_completion_required: true,
        missing_fields: ['weight_kg', 'height_cm'],
        tdee: null,
        macros: null,
      }),
    )
    const store = useNutritionGoalsStore()

    await store.fetchMacros()

    expect(store.macros?.profile_completion_required).toBe(true)
    expect(store.macros?.missing_fields).toEqual(['weight_kg', 'height_cm'])
  })
})
