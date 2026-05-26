import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '../auth'
import { authApi, authSessionManager } from '@/services/auth'
import type { AuthSession } from '@/types'

const FAKE_SESSION: AuthSession = {
  user: { id: 'u-1', username: 'arthur', email: 'arthur@test.com', role: 'admin' },
  tokens: {
    accessToken: 'jwt-token',
    refreshToken: 'refresh',
    expiresAt: '2099-01-01T00:00:00.000Z',
  },
}

describe('stores/auth', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('initialise un état vide quand aucune session n est stockée', () => {
    const store = useAuthStore()
    expect(store.session).toBeNull()
    expect(store.isAuthenticated).toBe(false)
    expect(store.currentUser).toBeNull()
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
    expect(store.infoMessage).toBeNull()
  })

  it('clearMessages remet error et infoMessage à null', () => {
    const store = useAuthStore()
    store.error = 'boom'
    store.infoMessage = 'hello'
    store.clearMessages()
    expect(store.error).toBeNull()
    expect(store.infoMessage).toBeNull()
  })

  it('hydrateFromStorage relit la session depuis localStorage', () => {
    authSessionManager.setSession(FAKE_SESSION)
    const store = useAuthStore()
    store.hydrateFromStorage()
    expect(store.session).toEqual(FAKE_SESSION)
    expect(store.isAuthenticated).toBe(true)
    expect(store.currentUser).toEqual(FAKE_SESSION.user)
  })

  it('login: succès — set la session et un message info', async () => {
    vi.spyOn(authApi, 'login').mockResolvedValue(FAKE_SESSION)
    const store = useAuthStore()

    await store.login('arthur@test.com', 'password')

    expect(store.session).toEqual(FAKE_SESSION)
    expect(store.isAuthenticated).toBe(true)
    expect(store.infoMessage).toMatch(/connexion/i)
    expect(store.loading).toBe(false)
    expect(authSessionManager.getSession()).toEqual(FAKE_SESSION)
  })

  it('login: échec — set error et relance l erreur', async () => {
    vi.spyOn(authApi, 'login').mockRejectedValue(new Error('Bad creds'))
    const store = useAuthStore()

    await expect(store.login('a@b.c', 'bad')).rejects.toThrow('Bad creds')

    expect(store.session).toBeNull()
    expect(store.error).toBe('Bad creds')
    expect(store.loading).toBe(false)
  })

  it('login: échec avec erreur non-Error — message par défaut', async () => {
    vi.spyOn(authApi, 'login').mockRejectedValue('weird')
    const store = useAuthStore()

    await expect(store.login('a@b.c', 'bad')).rejects.toBe('weird')
    expect(store.error).toMatch(/erreur lors de la connexion/i)
  })

  it('register: succès — pas de session, info de vérification email', async () => {
    const spy = vi.spyOn(authApi, 'register').mockResolvedValue(undefined)
    const store = useAuthStore()

    await store.register('Arthur', 'arthur@test.com', 'password')

    expect(spy).toHaveBeenCalledWith('Arthur', 'arthur@test.com', 'password')
    expect(store.session).toBeNull()
    expect(store.infoMessage).toMatch(/vérifiez votre email|verifiez votre email/i)
    expect(store.loading).toBe(false)
  })

  it('register: échec — set error et relance', async () => {
    vi.spyOn(authApi, 'register').mockRejectedValue(new Error('Email exists'))
    const store = useAuthStore()

    await expect(store.register('A', 'a@b.c', 'pwd')).rejects.toThrow('Email exists')
    expect(store.error).toBe('Email exists')
    expect(store.loading).toBe(false)
  })

  it('register: erreur non-Error — message par défaut', async () => {
    vi.spyOn(authApi, 'register').mockRejectedValue('boom')
    const store = useAuthStore()
    await expect(store.register('A', 'a@b.c', 'pwd')).rejects.toBe('boom')
    expect(store.error).toMatch(/inscription/i)
  })

  it('requestPasswordReset: succès — message info', async () => {
    const spy = vi.spyOn(authApi, 'requestPasswordReset').mockResolvedValue(undefined)
    const store = useAuthStore()

    await store.requestPasswordReset('arthur@test.com')

    expect(spy).toHaveBeenCalledWith('arthur@test.com')
    expect(store.infoMessage).toMatch(/email de réinitialisation|email de reinitialisation/i)
  })

  it('requestPasswordReset: échec — error + rethrow', async () => {
    vi.spyOn(authApi, 'requestPasswordReset').mockRejectedValue(new Error('SMTP down'))
    const store = useAuthStore()
    await expect(store.requestPasswordReset('a@b.c')).rejects.toThrow('SMTP down')
    expect(store.error).toBe('SMTP down')
  })

  it('requestPasswordReset: erreur non-Error — message par défaut', async () => {
    vi.spyOn(authApi, 'requestPasswordReset').mockRejectedValue('nope')
    const store = useAuthStore()
    await expect(store.requestPasswordReset('a@b.c')).rejects.toBe('nope')
    expect(store.error).toMatch(/demande/i)
  })

  it('refreshSession: no-op si pas de session', async () => {
    const spy = vi.spyOn(authApi, 'refreshAccessToken')
    const store = useAuthStore()
    await store.refreshSession()
    expect(spy).not.toHaveBeenCalled()
  })

  it('refreshSession: no-op si token encore valide', async () => {
    authSessionManager.setSession(FAKE_SESSION)
    const store = useAuthStore()
    store.hydrateFromStorage()
    const spy = vi.spyOn(authApi, 'refreshAccessToken')

    await store.refreshSession()
    expect(spy).not.toHaveBeenCalled()
  })

  it('refreshSession: token expiré — appelle refreshAccessToken et met à jour la session', async () => {
    const expired: AuthSession = {
      ...FAKE_SESSION,
      tokens: { ...FAKE_SESSION.tokens, expiresAt: '2000-01-01T00:00:00.000Z' },
    }
    const store = useAuthStore()
    store.session = expired

    const newTokens = { accessToken: 'new-jwt', refreshToken: 'refresh', expiresAt: '2099-01-01T00:00:00.000Z' }
    vi.spyOn(authApi, 'refreshAccessToken').mockResolvedValue(newTokens)

    await store.refreshSession()

    expect(store.session?.tokens.accessToken).toBe('new-jwt')
    expect(store.loading).toBe(false)
  })

  it('refreshSession: erreur — vide la session et set error', async () => {
    const expired: AuthSession = {
      ...FAKE_SESSION,
      tokens: { ...FAKE_SESSION.tokens, expiresAt: '2000-01-01T00:00:00.000Z' },
    }
    const store = useAuthStore()
    store.session = expired

    vi.spyOn(authApi, 'refreshAccessToken').mockRejectedValue(new Error('refresh failed'))

    await expect(store.refreshSession()).rejects.toThrow('refresh failed')
    expect(store.session).toBeNull()
    expect(store.error).toBe('refresh failed')
  })

  it('refreshSession: erreur non-Error — message par défaut', async () => {
    const expired: AuthSession = {
      ...FAKE_SESSION,
      tokens: { ...FAKE_SESSION.tokens, expiresAt: '2000-01-01T00:00:00.000Z' },
    }
    const store = useAuthStore()
    store.session = expired

    vi.spyOn(authApi, 'refreshAccessToken').mockRejectedValue('boom')

    await expect(store.refreshSession()).rejects.toBe('boom')
    expect(store.error).toMatch(/session expirée|session expiree/i)
  })

  it('bootstrapFromSession: succès — set la session et retourne true', async () => {
    const authModule = await import('@/services/auth')
    vi.spyOn(authModule, 'tryBootstrapFromCookie').mockResolvedValue(FAKE_SESSION)
    const store = useAuthStore()

    const result = await store.bootstrapFromSession()
    expect(result).toBe(true)
    expect(store.session).toEqual(FAKE_SESSION)
  })

  it('bootstrapFromSession: pas de session côté serveur — retourne false', async () => {
    const authModule = await import('@/services/auth')
    vi.spyOn(authModule, 'tryBootstrapFromCookie').mockResolvedValue(null)
    const store = useAuthStore()

    const result = await store.bootstrapFromSession()
    expect(result).toBe(false)
    expect(store.session).toBeNull()
  })

  it('bootstrapFromSession: exception — retourne false sans crasher', async () => {
    const authModule = await import('@/services/auth')
    vi.spyOn(authModule, 'tryBootstrapFromCookie').mockRejectedValue(new Error('Network'))
    const store = useAuthStore()

    const result = await store.bootstrapFromSession()
    expect(result).toBe(false)
  })

  it('logout: appelle authApi.logout, clear session et set un message', async () => {
    authSessionManager.setSession(FAKE_SESSION)
    const store = useAuthStore()
    store.hydrateFromStorage()

    const spy = vi.spyOn(authApi, 'logout').mockResolvedValue(undefined)

    await store.logout()

    expect(spy).toHaveBeenCalled()
    expect(store.session).toBeNull()
    expect(store.infoMessage).toMatch(/déconnexion|deconnexion/i)
    expect(authSessionManager.getSession()).toBeNull()
  })
})
