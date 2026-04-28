import type { AuthSession, UserRole, AuthUser } from '@/types'

const AUTH_SESSION_STORAGE_KEY = 'healthai.auth.session'
const ACCESS_TOKEN_TTL_MS = 1000 * 60 * 60 // 1h

function isClientEnvironment(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function createMockToken(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`
  }
  return `${prefix}_${Math.random().toString(36).slice(2)}_${Date.now()}`
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

function inferRoleFromEmail(email: string): UserRole {
  const lowerEmail = email.toLowerCase()
  if (lowerEmail.includes('admin') || lowerEmail.endsWith('@healthai-admin.test')) {
    return 'admin'
  }
  return 'user'
}

function createMockUserFromEmail(email: string): AuthUser {
  const [username] = email.split('@')
  return {
    id: `user_${Date.now()}`,
    username: username || 'admin',
    email,
    role: inferRoleFromEmail(email),
  }
}

function createMockSession(email: string): AuthSession {
  return {
    user: createMockUserFromEmail(email),
    tokens: {
      accessToken: createMockToken('access'),
      refreshToken: createMockToken('refresh'),
      expiresAt: createTokenExpirationDate(ACCESS_TOKEN_TTL_MS),
    },
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

export const authApi = {
  // Point de branchement Better Auth: remplacer les implémentations mock ci-dessous
  // par les appels authClient.signIn/signUp/forgotPassword/refresh.
  async login(email: string, password: string): Promise<AuthSession> {
    if (!email || !password) {
      throw new Error('Email et mot de passe requis')
    }
    return Promise.resolve(createMockSession(email))
  },

  async register(name: string, email: string, password: string): Promise<AuthSession> {
    if (!name || !email || !password) {
      throw new Error('Nom, email et mot de passe requis')
    }
    return Promise.resolve({
      ...createMockSession(email),
      user: {
        ...createMockUserFromEmail(email),
        username: name,
      },
    })
  },

  async requestPasswordReset(email: string): Promise<void> {
    if (!email) {
      throw new Error('Email requis pour réinitialiser le mot de passe')
    }
    return Promise.resolve()
  },

  async refreshAccessToken(refreshToken: string): Promise<AuthSession['tokens']> {
    if (!refreshToken) {
      throw new Error('Refresh token manquant')
    }
    return Promise.resolve({
      accessToken: createMockToken('access'),
      refreshToken,
      expiresAt: createTokenExpirationDate(ACCESS_TOKEN_TTL_MS),
    })
  },
}
