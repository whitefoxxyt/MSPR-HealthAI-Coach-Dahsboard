import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useNutritionStore } from '../nutrition'
import { userApi } from '@/services/api'

describe('Nutrition Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initialise avec les valeurs par défaut', () => {
    const store = useNutritionStore()
    expect(store.summary).toBeNull()
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
    expect(store.lastUpdated).toBeNull()
  })

  it('calcule la progression hydratation', async () => {
    const store = useNutritionStore()
    vi.spyOn(userApi, 'getNutritionSummary').mockResolvedValue({
      date: new Date().toISOString(),
      consumedCalories: 1800,
      targetCalories: 2000,
      proteinGrams: 95,
      carbsGrams: 190,
      fatsGrams: 65,
      hydrationLiters: 1.8,
      hydrationTargetLiters: 2.4,
      mealCount: 4,
      adherenceRate: 88,
      weeklyCaloriesTrend: [],
      macroDistribution: [],
    })

    await store.fetchNutritionSummary()
    expect(store.hydrationProgress).toBe(75)
  })
})
