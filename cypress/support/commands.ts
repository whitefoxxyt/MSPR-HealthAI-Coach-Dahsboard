/// <reference types="cypress" />

export type AuthRole = 'admin' | 'user'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /**
       * Seeds an authenticated session directly into localStorage so the route
       * guards see a logged-in user. Uses an unsigned JWT whose `email` claim
       * decides whether the user is treated as admin (cf. utils/auth-role.ts).
       */
      seedSession(role: AuthRole): Chainable<void>
    }
  }
}

const STORAGE_KEY = 'healthai.auth.session'

function base64UrlEncode(value: string): string {
  return btoa(value)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function buildFakeJwt(email: string): string {
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = base64UrlEncode(
    JSON.stringify({
      sub: `cypress-${email}`,
      email,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    }),
  )
  return `${header}.${payload}.cypress-signature`
}

Cypress.Commands.add('seedSession', (role: AuthRole) => {
  const email =
    role === 'admin'
      ? (Cypress.env('ADMIN_EMAIL') as string)
      : (Cypress.env('USER_EMAIL') as string)
  const id = role === 'admin' ? 'cypress-admin' : 'cypress-user'

  const session = {
    user: {
      id,
      username: email.split('@')[0],
      email,
      role: 'admin',
    },
    tokens: {
      accessToken: buildFakeJwt(email),
      refreshToken: `refresh-${id}`,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    },
  }

  cy.window().then((win) => {
    win.localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  })
})


