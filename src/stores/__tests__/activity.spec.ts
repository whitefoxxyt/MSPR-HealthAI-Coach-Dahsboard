import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useActivityStore } from '../activity'
import { userApi } from '@/services/api'

describe('Activity Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initialise avec les valeurs par défaut', () => {
    const store = useActivityStore()
    expect(store.summary).toBeNull()
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
    expect(store.lastUpdated).toBeNull()
  })

  it('calcule la progression pas', async () => {
    const store = useActivityStore()
    vi.spyOn(userApi, 'getActivitySummary').mockResolvedValue({
      date: new Date().toISOString(),
      steps: 7000,
      stepsTarget: 10000,
      activeMinutes: 45,
      workoutCount: 1,
      caloriesBurned: 390,
      weeklyStepsTrend: [],
      intensityDistribution: [],
    })

    await store.fetchActivitySummary()
    expect(store.stepsProgress).toBe(70)
  })
})
