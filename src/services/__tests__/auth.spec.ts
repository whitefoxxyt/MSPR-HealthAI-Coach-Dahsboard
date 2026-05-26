import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { authApi, authSessionManager, tryBootstrapFromCookie } from '../auth'
import type { AuthSession } from '@/types'

const AUTH_STORAGE_KEY = 'healthai.auth.session'
const AUTH_BASE_URL = 'http://localhost:3000'

const VALID_SESSION: AuthSession = {
  user: { id: 'u-1', username: 'arthur', email: 'arthur@test.com', role: 'admin' },
  tokens: {
    accessToken: 'jwt',
    refreshToken: 'refresh',
    expiresAt: '2099-01-01T00:00:00.000Z',
  },
}

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('services/auth — authSessionManager', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('getSession: retourne null quand vide', () => {
    expect(authSessionManager.getSession()).toBeNull()
  })

  it('setSession + getSession: round-trip JSON', () => {
    authSessionManager.setSession(VALID_SESSION)
    expect(authSessionManager.getSession()).toEqual(VALID_SESSION)
  })

  it('getSession: efface et retourne null si la session est expirée', () => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
      ...VALID_SESSION,
      tokens: { ...VALID_SESSION.tokens, expiresAt: '2000-01-01T00:00:00.000Z' },
    }))
    expect(authSessionManager.getSession()).toBeNull()
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull()
  })

  it('getSession: efface et retourne null si la session a une date invalide', () => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
      ...VALID_SESSION,
      tokens: { ...VALID_SESSION.tokens, expiresAt: 'invalid-date' },
    }))
    expect(authSessionManager.getSession()).toBeNull()
  })

  it('getSession: JSON malformé — efface et retourne null sans crasher', () => {
    localStorage.setItem(AUTH_STORAGE_KEY, '{not-json')
    expect(authSessionManager.getSession()).toBeNull()
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull()
  })

  it('getSession: objet partiel — retourne null', () => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user: { id: 'x' } }))
    expect(authSessionManager.getSession()).toBeNull()
  })

  it('clearSession: vide la clé du localStorage', () => {
    authSessionManager.setSession(VALID_SESSION)
    authSessionManager.clearSession()
    expect(authSessionManager.getSession()).toBeNull()
  })

  it('hasValidSession: true si session présente, false sinon', () => {
    expect(authSessionManager.hasValidSession()).toBe(false)
    authSessionManager.setSession(VALID_SESSION)
    expect(authSessionManager.hasValidSession()).toBe(true)
  })

  it('getAccessToken: renvoie le token de la session', () => {
    expect(authSessionManager.getAccessToken()).toBeNull()
    authSessionManager.setSession(VALID_SESSION)
    expect(authSessionManager.getAccessToken()).toBe('jwt')
  })
})

describe('services/auth — authApi.login', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    localStorage.clear()
    fetchSpy = vi.spyOn(globalThis, 'fetch')
  })

  afterEach(() => {
    fetchSpy.mockRestore()
  })

  it('rejette si email ou password vides', async () => {
    await expect(authApi.login('', 'p')).rejects.toThrow(/email et mot de passe requis/i)
    await expect(authApi.login('a@b.c', '')).rejects.toThrow(/email et mot de passe requis/i)
  })

  it('appelle /sign-in/email puis /jwt et construit une session admin', async () => {
    fetchSpy.mockImplementation((url) => {
      if (String(url).includes('/sign-in/email')) {
        return Promise.resolve(jsonResponse({ user: { id: 'u-1', name: 'Arthur', email: 'a@b.c' }, token: 't' }))
      }
      if (String(url).includes('/jwt')) {
        return Promise.resolve(jsonResponse({ token: 'jwt-from-server' }))
      }
      throw new Error('unexpected url')
    })

    const session = await authApi.login('a@b.c', 'pwd')

    expect(session.user.id).toBe('u-1')
    expect(session.user.username).toBe('Arthur')
    expect(session.user.email).toBe('a@b.c')
    expect(session.user.role).toBe('admin')
    expect(session.tokens.accessToken).toBe('jwt-from-server')
    expect(session.tokens.refreshToken).toBe('t')

    const signInCall = fetchSpy.mock.calls.find((args) => String(args[0]).includes('/sign-in/email'))!
    expect(signInCall[0]).toBe(`${AUTH_BASE_URL}/api/auth/sign-in/email`)
    expect((signInCall[1] as RequestInit).method).toBe('POST')
    expect((signInCall[1] as RequestInit).credentials).toBe('include')
    expect(JSON.parse((signInCall[1] as RequestInit).body as string)).toEqual({ email: 'a@b.c', password: 'pwd' })
  })

  it('fallback sur user.id comme refreshToken si pas de token retourné', async () => {
    fetchSpy.mockImplementation((url) => {
      if (String(url).includes('/sign-in/email')) {
        return Promise.resolve(jsonResponse({ user: { id: 'u-42', email: 'x@y.z' } }))
      }
      if (String(url).includes('/jwt')) {
        return Promise.resolve(jsonResponse({ token: 'jwt' }))
      }
      throw new Error('unexpected')
    })

    const session = await authApi.login('x@y.z', 'pwd')
    expect(session.tokens.refreshToken).toBe('u-42')
    expect(session.user.username).toBe('x')
  })

  it('lève une erreur avec le message renvoyé par l API en cas de 401', async () => {
    fetchSpy.mockResolvedValue(new Response(JSON.stringify({ message: 'Wrong creds' }), { status: 401 }))
    await expect(authApi.login('a@b.c', 'bad')).rejects.toThrow('Wrong creds')
  })

  it('lève une erreur générique si le body n est pas JSON', async () => {
    fetchSpy.mockResolvedValue(new Response('plain text', { status: 500 }))
    await expect(authApi.login('a@b.c', 'bad')).rejects.toThrow(/erreur de connexion \(500\)/i)
  })

  it('lève une erreur si /jwt n est pas ok', async () => {
    fetchSpy.mockImplementation((url) => {
      if (String(url).includes('/sign-in/email')) {
        return Promise.resolve(jsonResponse({ user: { id: 'u', email: 'a@b.c' }, token: 't' }))
      }
      return Promise.resolve(new Response('boom', { status: 500 }))
    })
    await expect(authApi.login('a@b.c', 'pwd')).rejects.toThrow(/token jwt/i)
  })

  it('lève une erreur si la réponse /jwt n a pas de token', async () => {
    fetchSpy.mockImplementation((url) => {
      if (String(url).includes('/sign-in/email')) {
        return Promise.resolve(jsonResponse({ user: { id: 'u', email: 'a@b.c' }, token: 't' }))
      }
      return Promise.resolve(jsonResponse({ error: 'missing' }))
    })
    await expect(authApi.login('a@b.c', 'pwd')).rejects.toThrow(/missing/i)
  })
})

describe('services/auth — authApi.register', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch')
  })

  afterEach(() => {
    fetchSpy.mockRestore()
  })

  it('rejette si un champ requis est manquant', async () => {
    await expect(authApi.register('', 'a@b.c', 'pwd')).rejects.toThrow(/nom.+email.+mot/i)
    await expect(authApi.register('A', '', 'pwd')).rejects.toThrow(/nom.+email.+mot/i)
    await expect(authApi.register('A', 'a@b.c', '')).rejects.toThrow(/nom.+email.+mot/i)
  })

  it('appelle /sign-up/email avec name/email/password', async () => {
    fetchSpy.mockResolvedValue(jsonResponse({ ok: true }))
    await authApi.register('Arthur', 'a@b.c', 'pwd')

    expect(fetchSpy).toHaveBeenCalledWith(
      `${AUTH_BASE_URL}/api/auth/sign-up/email`,
      expect.objectContaining({ method: 'POST' }),
    )
    const init = fetchSpy.mock.calls[0]![1] as RequestInit
    expect(JSON.parse(init.body as string)).toEqual({ name: 'Arthur', email: 'a@b.c', password: 'pwd' })
  })

  it('lève une erreur si réponse !ok', async () => {
    fetchSpy.mockResolvedValue(new Response(JSON.stringify({ message: 'Email taken' }), { status: 409 }))
    await expect(authApi.register('A', 'a@b.c', 'pwd')).rejects.toThrow('Email taken')
  })

  it('lève une erreur générique si !ok et body non-JSON', async () => {
    fetchSpy.mockResolvedValue(new Response('bad', { status: 500 }))
    await expect(authApi.register('A', 'a@b.c', 'pwd')).rejects.toThrow(/inscription \(500\)/i)
  })
})

describe('services/auth — authApi.requestPasswordReset', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch')
  })

  afterEach(() => {
    fetchSpy.mockRestore()
  })

  it('rejette si email vide', async () => {
    await expect(authApi.requestPasswordReset('')).rejects.toThrow(/email requis/i)
  })

  it('envoie email + redirectTo basé sur window.location.origin', async () => {
    fetchSpy.mockResolvedValue(jsonResponse({}))
    await authApi.requestPasswordReset('a@b.c')

    const init = fetchSpy.mock.calls[0]![1] as RequestInit
    const body = JSON.parse(init.body as string) as { email: string; redirectTo: string }
    expect(body.email).toBe('a@b.c')
    expect(body.redirectTo).toMatch(/\/reset-password$/)
  })

  it('lève une erreur avec le message du serveur si !ok', async () => {
    fetchSpy.mockResolvedValue(new Response(JSON.stringify({ message: 'SMTP down' }), { status: 502 }))
    await expect(authApi.requestPasswordReset('a@b.c')).rejects.toThrow('SMTP down')
  })

  it('lève une erreur générique si !ok et body non-JSON', async () => {
    fetchSpy.mockResolvedValue(new Response('boom', { status: 500 }))
    await expect(authApi.requestPasswordReset('a@b.c')).rejects.toThrow(/réinitialisation|reinitialisation/i)
  })
})

describe('services/auth — authApi.refreshAccessToken', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch')
  })

  afterEach(() => {
    fetchSpy.mockRestore()
  })

  it('récupère un nouveau accessToken via /jwt et conserve le refreshToken', async () => {
    fetchSpy.mockResolvedValue(jsonResponse({ token: 'new-jwt' }))
    const tokens = await authApi.refreshAccessToken('refresh-x')

    expect(tokens.accessToken).toBe('new-jwt')
    expect(tokens.refreshToken).toBe('refresh-x')
    expect(typeof tokens.expiresAt).toBe('string')
    expect(Number.isNaN(Date.parse(tokens.expiresAt))).toBe(false)
  })
})

describe('services/auth — authApi.logout', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch')
  })

  afterEach(() => {
    fetchSpy.mockRestore()
  })

  it('appelle /sign-out en POST', async () => {
    fetchSpy.mockResolvedValue(new Response(null, { status: 200 }))
    await authApi.logout()

    expect(fetchSpy).toHaveBeenCalledWith(
      `${AUTH_BASE_URL}/api/auth/sign-out`,
      expect.objectContaining({ method: 'POST', credentials: 'include' }),
    )
  })

  it('ne crash pas si le fetch échoue', async () => {
    fetchSpy.mockRejectedValue(new Error('Network down'))
    await expect(authApi.logout()).resolves.toBeUndefined()
  })
})

describe('services/auth — tryBootstrapFromCookie', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch')
  })

  afterEach(() => {
    fetchSpy.mockRestore()
  })

  it('retourne null si /api/session !ok', async () => {
    fetchSpy.mockResolvedValue(new Response(null, { status: 401 }))
    expect(await tryBootstrapFromCookie()).toBeNull()
  })

  it('retourne null si la réponse n a pas d utilisateur', async () => {
    fetchSpy.mockResolvedValue(jsonResponse({}))
    expect(await tryBootstrapFromCookie()).toBeNull()
  })

  it('retourne une session valide après fetch JWT', async () => {
    fetchSpy.mockImplementation((url) => {
      if (String(url).includes('/api/session')) {
        return Promise.resolve(jsonResponse({ user: { id: 'u-1', name: 'Arthur', email: 'a@b.c' } }))
      }
      if (String(url).includes('/api/jwt')) {
        return Promise.resolve(jsonResponse({ token: 'jwt-from-cookie' }))
      }
      throw new Error('unexpected')
    })

    const session = await tryBootstrapFromCookie()
    expect(session).not.toBeNull()
    expect(session!.user.id).toBe('u-1')
    expect(session!.user.email).toBe('a@b.c')
    expect(session!.tokens.accessToken).toBe('jwt-from-cookie')
    expect(session!.tokens.refreshToken).toBe('u-1')
  })

  it('retourne null si le fetch global jette', async () => {
    fetchSpy.mockRejectedValue(new Error('Network'))
    expect(await tryBootstrapFromCookie()).toBeNull()
  })

  it('retourne null si /api/jwt échoue', async () => {
    fetchSpy.mockImplementation((url) => {
      if (String(url).includes('/api/session')) {
        return Promise.resolve(jsonResponse({ user: { id: 'u-1', email: 'a@b.c' } }))
      }
      return Promise.resolve(new Response('boom', { status: 500 }))
    })
    expect(await tryBootstrapFromCookie()).toBeNull()
  })
})
