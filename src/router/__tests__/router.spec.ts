import { describe, it, expect } from 'vitest'
import router from '@/router'
import SettingsView from '@/views/user/SettingsView.vue'
import MealPlanView from '@/views/MealPlanView.vue'

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
})
