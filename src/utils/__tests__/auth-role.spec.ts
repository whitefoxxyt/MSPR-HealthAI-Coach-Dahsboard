import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const AUTH_STORAGE_KEY = 'healthai.auth.session'

// Build a JWT with a base64url-encoded payload (signature unused — we only decode).
function buildJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `${header}.${body}.signature`
}

function seedSession(jwt: string) {
  localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({
      user: { id: 'u1', username: 'u', email: 'irrelevant@example.com', role: 'admin' },
      tokens: { accessToken: jwt, refreshToken: 'r', expiresAt: '2099-01-01T00:00:00.000Z' },
    }),
  )
}

describe('isCurrentUserAdmin', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_ADMIN_EMAILS', 'admin@vital.app,boss@vital.app')
  })

  afterEach(() => {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('returns true when the session JWT email belongs to VITE_ADMIN_EMAILS', async () => {
    seedSession(buildJwt({ email: 'admin@vital.app' }))
    const { isCurrentUserAdmin } = await import('../auth-role')
    expect(isCurrentUserAdmin()).toBe(true)
  })

  it('returns false when the session JWT email is not an admin email', async () => {
    seedSession(buildJwt({ email: 'normal@vital.app' }))
    const { isCurrentUserAdmin } = await import('../auth-role')
    expect(isCurrentUserAdmin()).toBe(false)
  })

  it('returns false when no session is present', async () => {
    const { isCurrentUserAdmin } = await import('../auth-role')
    expect(isCurrentUserAdmin()).toBe(false)
  })

  it('returns false when the JWT cannot be decoded', async () => {
    seedSession('not-a-jwt')
    const { isCurrentUserAdmin } = await import('../auth-role')
    expect(isCurrentUserAdmin()).toBe(false)
  })

  it('trims whitespace and is case-insensitive on emails', async () => {
    vi.stubEnv('VITE_ADMIN_EMAILS', '  Admin@Vital.app , boss@vital.app ')
    seedSession(buildJwt({ email: 'ADMIN@vital.app' }))
    const { isCurrentUserAdmin } = await import('../auth-role')
    expect(isCurrentUserAdmin()).toBe(true)
  })
})
