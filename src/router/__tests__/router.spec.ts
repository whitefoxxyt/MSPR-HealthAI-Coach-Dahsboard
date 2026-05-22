import { describe, it, expect } from 'vitest'
import router from '@/router'
import MealAnalysisView from '@/views/MealAnalysisView.vue'
import SettingsView from '@/views/user/SettingsView.vue'
import MealPlanView from '@/views/MealPlanView.vue'
import FitnessProgramView from '@/views/FitnessProgramView.vue'
import FitnessProgramHistoryView from '@/views/FitnessProgramHistoryView.vue'
import FitnessProgramDetailView from '@/views/FitnessProgramDetailView.vue'

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

  it('expose une route nommée "fitness-programs" sur /fitness-programs', () => {
    const route = router.resolve('/fitness-programs')
    expect(route.name).toBe('fitness-programs')
  })

  it('protège /fitness-programs par requireAuth', () => {
    const route = router.resolve('/fitness-programs')
    expect(route.meta.requireAuth).toBe(true)
  })

  it('rend FitnessProgramHistoryView sur /fitness-programs', () => {
    const route = router.resolve('/fitness-programs')
    expect(route.matched.some((r) => r.components?.default === FitnessProgramHistoryView)).toBe(true)
  })

  it('expose une route nommée "fitness-program-detail" sur /fitness-programs/:id', () => {
    const route = router.resolve('/fitness-programs/prog-abc')
    expect(route.name).toBe('fitness-program-detail')
    expect(route.params.id).toBe('prog-abc')
  })

  it('protège /fitness-programs/:id par requireAuth', () => {
    const route = router.resolve('/fitness-programs/prog-abc')
    expect(route.meta.requireAuth).toBe(true)
  })

  it('rend FitnessProgramDetailView sur /fitness-programs/:id', () => {
    const route = router.resolve('/fitness-programs/prog-abc')
    expect(route.matched.some((r) => r.components?.default === FitnessProgramDetailView)).toBe(true)
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
})
