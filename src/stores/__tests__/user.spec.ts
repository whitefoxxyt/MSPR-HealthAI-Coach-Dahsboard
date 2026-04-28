import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useUserStore } from '../user'
import { userApi } from '@/services/api'

describe('User Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initialise avec les valeurs par défaut', () => {
    const store = useUserStore()
    expect(store.profile).toBeNull()
    expect(store.metrics).toBeNull()
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
    expect(store.lastUpdated).toBeNull()
  })

  it('charge profil et métriques', async () => {
    const store = useUserStore()
    vi.spyOn(userApi, 'getProfile').mockResolvedValue({
      id: 'u-1',
      fullName: 'Test User',
      email: 'test@healthai.test',
      objective: 'Forme',
      age: 28,
      heightCm: 170,
      weightKg: 70,
      dailyCalorieTarget: 2000,
      dailyHydrationTargetLiters: 2,
    })
    vi.spyOn(userApi, 'getDashboardMetrics').mockResolvedValue({
      streakDays: 4,
      weeklyGoalProgress: 65,
      hydrationProgress: 70,
      caloriesConsumed: 1600,
      caloriesTarget: 2000,
    })

    await store.hydrateDashboard()

    expect(store.profile?.id).toBe('u-1')
    expect(store.metrics?.streakDays).toBe(4)
    expect(store.calorieProgress).toBe(80)
    expect(store.lastUpdated).not.toBeNull()
  })
})
