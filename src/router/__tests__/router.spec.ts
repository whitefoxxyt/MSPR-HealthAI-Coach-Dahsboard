import { describe, it, expect } from 'vitest'
import router from '@/router'
import SettingsView from '@/views/user/SettingsView.vue'
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
})
