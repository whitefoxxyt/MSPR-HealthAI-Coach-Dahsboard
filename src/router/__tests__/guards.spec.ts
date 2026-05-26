import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import router from '@/router'
import { authSessionManager } from '@/services/auth'
import * as authRole from '@/utils/auth-role'
import { useAuthStore } from '@/stores/auth'
import type { AuthSession } from '@/types'

const VALID_SESSION: AuthSession = {
  user: { id: 'u', username: 'u', email: 'u@a.b', role: 'admin' },
  tokens: { accessToken: 't', refreshToken: 'r', expiresAt: '2099-01-01T00:00:00.000Z' },
}

describe('router guards', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    localStorage.clear()
    await router.push('/login')
    await router.isReady()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('non authentifié + bootstrap échoue: /admin redirige vers /login', async () => {
    vi.spyOn(authSessionManager, 'hasValidSession').mockReturnValue(false)
    vi.spyOn(useAuthStore(), 'bootstrapFromSession').mockResolvedValue(false)

    await router.push('/admin')
    expect(router.currentRoute.value.name).toBe('login')
  })

  it('authentifié + admin: /admin permet l accès admin-dashboard', async () => {
    vi.spyOn(authSessionManager, 'hasValidSession').mockReturnValue(true)
    vi.spyOn(authRole, 'isCurrentUserAdmin').mockReturnValue(true)

    await router.push('/admin')
    expect(router.currentRoute.value.name).toBe('admin-dashboard')
  })

  it('authentifié + non admin: /admin redirige vers /home avec denied=admin', async () => {
    vi.spyOn(authSessionManager, 'hasValidSession').mockReturnValue(true)
    vi.spyOn(authRole, 'isCurrentUserAdmin').mockReturnValue(false)

    await router.push('/admin')
    expect(router.currentRoute.value.name).toBe('home')
    expect(router.currentRoute.value.query.denied).toBe('admin')
  })

  it('authentifié: /login (guestOnly) redirige vers le dashboard pour un admin', async () => {
    vi.spyOn(authSessionManager, 'hasValidSession').mockReturnValue(true)
    vi.spyOn(authRole, 'isCurrentUserAdmin').mockReturnValue(true)

    await router.push('/admin')
    await router.push('/login')
    expect(router.currentRoute.value.name).toBe('admin-dashboard')
  })

  it('authentifié: /login (guestOnly) redirige vers home pour un non admin', async () => {
    vi.spyOn(authSessionManager, 'hasValidSession').mockReturnValue(true)
    vi.spyOn(authRole, 'isCurrentUserAdmin').mockReturnValue(false)

    await router.push('/')
    await router.push('/login')
    expect(router.currentRoute.value.name).toBe('home')
  })

  it('non authentifié mais bootstrap réussit en admin sur /admin', async () => {
    let bootstrapped = false
    vi.spyOn(authSessionManager, 'hasValidSession').mockImplementation(() => bootstrapped)
    vi.spyOn(authRole, 'isCurrentUserAdmin').mockImplementation(() => bootstrapped)
    vi.spyOn(useAuthStore(), 'bootstrapFromSession').mockImplementation(async () => {
      bootstrapped = true
      return true
    })

    await router.push('/admin')
    expect(router.currentRoute.value.name).toBe('admin-dashboard')
  })

  it('non authentifié mais bootstrap réussit non admin sur /admin -> home avec denied', async () => {
    let bootstrapped = false
    vi.spyOn(authSessionManager, 'hasValidSession').mockImplementation(() => bootstrapped)
    vi.spyOn(authRole, 'isCurrentUserAdmin').mockReturnValue(false)
    vi.spyOn(useAuthStore(), 'bootstrapFromSession').mockImplementation(async () => {
      bootstrapped = true
      return true
    })

    await router.push('/admin')
    expect(router.currentRoute.value.name).toBe('home')
    expect(router.currentRoute.value.query.denied).toBe('admin')
  })

  it('non authentifié mais bootstrap réussit sur /login -> dashboard pour admin', async () => {
    let bootstrapped = false
    vi.spyOn(authSessionManager, 'hasValidSession').mockImplementation(() => bootstrapped)
    vi.spyOn(authRole, 'isCurrentUserAdmin').mockImplementation(() => bootstrapped)
    vi.spyOn(useAuthStore(), 'bootstrapFromSession').mockImplementation(async () => {
      bootstrapped = true
      return true
    })

    await router.push('/admin')
    await router.push('/login')
    expect(router.currentRoute.value.name).toBe('admin-dashboard')
  })

  it('met à jour document.title via afterEach', async () => {
    vi.spyOn(authSessionManager, 'hasValidSession').mockReturnValue(true)
    vi.spyOn(authRole, 'isCurrentUserAdmin').mockReturnValue(true)

    await router.push('/admin')
    expect(document.title).toMatch(/dashboard/i)

    await router.push('/admin/data-cleaning')
    expect(document.title).toMatch(/nettoyage/i)

    await router.push('/admin/validation')
    expect(document.title).toMatch(/validation/i)
  })

  it('redirige legacy /dashboard vers /admin', async () => {
    vi.spyOn(authSessionManager, 'hasValidSession').mockReturnValue(true)
    vi.spyOn(authRole, 'isCurrentUserAdmin').mockReturnValue(true)

    await router.push('/dashboard')
    expect(router.currentRoute.value.name).toBe('admin-dashboard')
  })

  it('redirige legacy /data-cleaning vers /admin/data-cleaning', async () => {
    vi.spyOn(authSessionManager, 'hasValidSession').mockReturnValue(true)
    vi.spyOn(authRole, 'isCurrentUserAdmin').mockReturnValue(true)

    await router.push('/data-cleaning')
    expect(router.currentRoute.value.name).toBe('admin-data-cleaning')
  })

  it('redirige legacy /validation vers /admin/validation', async () => {
    vi.spyOn(authSessionManager, 'hasValidSession').mockReturnValue(true)
    vi.spyOn(authRole, 'isCurrentUserAdmin').mockReturnValue(true)

    await router.push('/validation')
    expect(router.currentRoute.value.name).toBe('admin-validation')
  })

  it('redirige une route inconnue vers login (catch-all)', async () => {
    vi.spyOn(authSessionManager, 'hasValidSession').mockReturnValue(false)
    vi.spyOn(useAuthStore(), 'bootstrapFromSession').mockResolvedValue(false)

    await router.push('/route-qui-n-existe-pas')
    expect(router.currentRoute.value.name).toBe('login')
  })

  it('session valide stockée: hasValidSession se base sur authSessionManager réel', async () => {
    authSessionManager.setSession(VALID_SESSION)
    vi.spyOn(authRole, 'isCurrentUserAdmin').mockReturnValue(true)

    await router.push('/admin')
    expect(router.currentRoute.value.name).toBe('admin-dashboard')
  })

  it('route non protégée (login) sans auth ni bootstrap: reste accessible', async () => {
    vi.spyOn(authSessionManager, 'hasValidSession').mockReturnValue(false)
    vi.spyOn(useAuthStore(), 'bootstrapFromSession').mockResolvedValue(false)

    await router.push('/login')
    expect(router.currentRoute.value.name).toBe('login')
  })
})
