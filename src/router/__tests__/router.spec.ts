import { describe, it, expect } from 'vitest'
import router from '@/router'
import MealAnalysisView from '@/views/MealAnalysisView.vue'
import MealAnalysisHistoryView from '@/views/MealAnalysisHistoryView.vue'
import SettingsView from '@/views/user/SettingsView.vue'
import MealPlanView from '@/views/MealPlanView.vue'
import FitnessProgramView from '@/views/FitnessProgramView.vue'

describe('router', () => {
  it('expose une route nommée "settings" sur /parametres', () => {
    const route = router.resolve('/parametres')
    expect(route.name).toBe('settings')
  })

  it('protège /parametres par requireAuth', () => {
    const route = router.resolve('/parametres')
    expect(route.meta.requireAuth).toBe(true)
  })

  it('rend SettingsView sur /parametres', () => {
    const route = router.resolve('/parametres')
    expect(route.matched.some((r) => r.components?.default === SettingsView)).toBe(true)
  })

  it('expose une route nommée "meal-plan" sur /meal-plan', () => {
    const route = router.resolve('/meal-plan')
    expect(route.name).toBe('meal-plan')
  })

  it('protège /meal-plan par requireAuth', () => {
    const route = router.resolve('/meal-plan')
    expect(route.meta.requireAuth).toBe(true)
  })

  it('rend MealPlanView sur /meal-plan', () => {
    const route = router.resolve('/meal-plan')
    expect(route.matched.some((r) => r.components?.default === MealPlanView)).toBe(true)
  })

  it('expose une route nommée "fitness-program" sur /fitness-program', () => {
    const route = router.resolve('/fitness-program')
    expect(route.name).toBe('fitness-program')
  })

  it('protège /fitness-program par requireAuth', () => {
    const route = router.resolve('/fitness-program')
    expect(route.meta.requireAuth).toBe(true)
  })

  it('rend FitnessProgramView sur /fitness-program', () => {
    const route = router.resolve('/fitness-program')
    expect(route.matched.some((r) => r.components?.default === FitnessProgramView)).toBe(true)
  })

  it('expose une route nommée "meal-analysis" sur /meal-analysis', () => {
    const route = router.resolve('/meal-analysis')
    expect(route.name).toBe('meal-analysis')
  })

  it('protège /meal-analysis par requireAuth', () => {
    const route = router.resolve('/meal-analysis')
    expect(route.meta.requireAuth).toBe(true)
  })

  it('rend MealAnalysisView sur /meal-analysis', () => {
    const route = router.resolve('/meal-analysis')
    expect(route.matched.some((r) => r.components?.default === MealAnalysisView)).toBe(true)
  })

  it('expose une route nommée "meal-analyses" sur /meal-analyses', () => {
    const route = router.resolve('/meal-analyses')
    expect(route.name).toBe('meal-analyses')
  })

  it('protège /meal-analyses par requireAuth', () => {
    const route = router.resolve('/meal-analyses')
    expect(route.meta.requireAuth).toBe(true)
  })

  it('rend MealAnalysisHistoryView sur /meal-analyses', () => {
    const route = router.resolve('/meal-analyses')
    expect(route.matched.some((r) => r.components?.default === MealAnalysisHistoryView)).toBe(true)
  })
})
