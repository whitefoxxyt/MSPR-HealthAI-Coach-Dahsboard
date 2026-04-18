import type { AdminUser, AuthSession } from '@/types'

const AUTH_SESSION_STORAGE_KEY = 'healthai.auth.session'
const ACCESS_TOKEN_TTL_MS = 1000 * 60 * 60 // 1h
const AUTH_BASE_URL = import.meta.env.VITE_AUTH_BASE_URL || 'http://localhost:3000'

function isClientEnvironment(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function createTokenExpirationDate(ttlInMs: number): string {
  return new Date(Date.now() + ttlInMs).toISOString()
}

function isAuthSession(candidate: unknown): candidate is AuthSession {
  if (!candidate || typeof candidate !== 'object') return false
  const session = candidate as Partial<AuthSession>
  return Boolean(
    session.user?.id &&
      session.user?.username &&
      session.user?.email &&
      session.user?.role &&
      session.tokens?.accessToken &&
      session.tokens?.refreshToken &&
      session.tokens?.expiresAt,
  )
}

function parseStoredSession(value: string | null): AuthSession | null {
  if (!value) return null
  const parsed = JSON.parse(value) as unknown
  if (!isAuthSession(parsed)) {
    throw new Error('Invalid auth session format in local storage')
  }
  return parsed
}

function isExpired(expiresAt: string): boolean {
  const parsedDate = Date.parse(expiresAt)
  if (Number.isNaN(parsedDate)) {
    return true
  }
  return parsedDate <= Date.now()
}

async function fetchJwtToken(): Promise<string> {
  const response = await fetch(`${AUTH_BASE_URL}/api/jwt`, {
    method: 'GET',
    credentials: 'include',
  })
  if (!response.ok) {
    throw new Error('Impossible de récupérer le token JWT')
  }
  const data = await response.json() as { token?: string; error?: string }
  if (!data.token) {
    throw new Error(data.error || 'Token JWT absent de la réponse')
  }
  return data.token
}

function buildAdminUser(betterAuthUser: { id: string; name?: string; email: string }): AdminUser {
  return {
    id: betterAuthUser.id,
    username: betterAuthUser.name ?? betterAuthUser.email.split('@')[0] ?? betterAuthUser.email,
    email: betterAuthUser.email,
    role: 'admin',
  }
}

export const authSessionManager = {
  getSession(): AuthSession | null {
    if (!isClientEnvironment()) return null
    try {
      const storedSession = parseStoredSession(window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY))
      if (storedSession && isExpired(storedSession.tokens.expiresAt)) {
        window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY)
        return null
      }
      return storedSession
    } catch (error) {
      console.error('Failed to read auth session from local storage:', error)
      window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY)
      return null
    }
  },

  setSession(session: AuthSession): void {
    if (!isClientEnvironment()) return
    window.localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session))
  },

  clearSession(): void {
    if (!isClientEnvironment()) return
    window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY)
  },

  hasValidSession(): boolean {
    return this.getSession() !== null
  },

  getAccessToken(): string | null {
    return this.getSession()?.tokens.accessToken ?? null
  },
}

export async function tryBootstrapFromCookie(): Promise<AuthSession | null> {
  try {
    const sessionResponse = await fetch(`${AUTH_BASE_URL}/api/session`, {
      method: 'GET',
      credentials: 'include',
    })
    if (!sessionResponse.ok) return null

    const sessionData = await sessionResponse.json() as {
      user?: { id: string; name?: string; email: string }
    }
    if (!sessionData?.user) return null

    const jwtToken = await fetchJwtToken()

    return {
      user: buildAdminUser(sessionData.user),
      tokens: {
        accessToken: jwtToken,
        refreshToken: sessionData.user.id,
        expiresAt: createTokenExpirationDate(ACCESS_TOKEN_TTL_MS),
      },
    }
  } catch {
    return null
  }
}

export const authApi = {
  async login(email: string, password: string): Promise<AuthSession> {
    if (!email || !password) {
      throw new Error('Email et mot de passe requis')
    }

    const signInResponse = await fetch(`${AUTH_BASE_URL}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    })

    if (!signInResponse.ok) {
      const err = await signInResponse.json().catch(() => ({})) as { message?: string }
      throw new Error(err.message || `Erreur de connexion (${signInResponse.status})`)
    }

    const signInData = await signInResponse.json() as {
      user: { id: string; name?: string; email: string }
      token?: string
    }

    const jwtToken = await fetchJwtToken()

    return {
      user: buildAdminUser(signInData.user),
      tokens: {
        accessToken: jwtToken,
        refreshToken: signInData.token || signInData.user.id,
        expiresAt: createTokenExpirationDate(ACCESS_TOKEN_TTL_MS),
      },
    }
  },

  async register(name: string, email: string, password: string): Promise<void> {
    if (!name || !email || !password) {
      throw new Error('Nom, email et mot de passe requis')
    }

    const signUpResponse = await fetch(`${AUTH_BASE_URL}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name, email, password }),
    })

    if (!signUpResponse.ok) {
      const err = await signUpResponse.json().catch(() => ({})) as { message?: string }
      throw new Error(err.message || `Erreur d'inscription (${signUpResponse.status})`)
    }
    // Email verification required — no session returned until the user clicks the link
  },

  async requestPasswordReset(email: string): Promise<void> {
    if (!email) {
      throw new Error('Email requis pour réinitialiser le mot de passe')
    }

    const redirectTo = isClientEnvironment()
      ? `${window.location.origin}/reset-password`
      : 'http://localhost:5173/reset-password'

    const response = await fetch(`${AUTH_BASE_URL}/api/auth/forget-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, redirectTo }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({})) as { message?: string }
      throw new Error(err.message || 'Erreur lors de la demande de réinitialisation')
    }
  },

  async refreshAccessToken(refreshToken: string): Promise<AuthSession['tokens']> {
    const jwtToken = await fetchJwtToken()
    return {
      accessToken: jwtToken,
      refreshToken,
      expiresAt: createTokenExpirationDate(ACCESS_TOKEN_TTL_MS),
    }
  },

  async logout(): Promise<void> {
    await fetch(`${AUTH_BASE_URL}/api/auth/sign-out`, {
      method: 'POST',
      credentials: 'include',
    }).catch(() => {
      // Best-effort: clear local session even if sign-out request fails
    })
  },
}
