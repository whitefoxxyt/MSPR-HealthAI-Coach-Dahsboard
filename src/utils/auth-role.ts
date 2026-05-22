import { jwtDecode } from 'jwt-decode'
import { authSessionManager } from '@/services/auth'

interface JwtClaims {
  email?: string
  sub?: string
}

function getAdminEmailSet(): Set<string> {
  const raw = (import.meta.env.VITE_ADMIN_EMAILS as string | undefined) ?? ''
  return new Set(
    raw
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  )
}

function decodeJwtEmail(token: string): string | null {
  try {
    const claims = jwtDecode<JwtClaims>(token)
    return claims.email ? claims.email.trim().toLowerCase() : null
  } catch {
    return null
  }
}

export function isCurrentUserAdmin(): boolean {
  const token = authSessionManager.getAccessToken()
  if (!token) return false

  const email = decodeJwtEmail(token)
  if (!email) return false

  return getAdminEmailSet().has(email)
}
