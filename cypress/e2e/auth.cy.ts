/// <reference types="cypress" />

/**
 * Login → JWT → redirection differenciee selon le role.
 * Mock complet de MSPR-AUTH via cy.intercept.
 */

const AUTH_BASE_URL = Cypress.env('AUTH_BASE_URL') as string
const ADMIN_EMAIL = Cypress.env('ADMIN_EMAIL') as string
const USER_EMAIL = Cypress.env('USER_EMAIL') as string

function base64UrlEncode(value: string): string {
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function jwtFor(email: string): string {
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = base64UrlEncode(
    JSON.stringify({
      sub: `cy-${email}`,
      email,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    }),
  )
  return `${header}.${payload}.sig`
}

describe('Authentication flow', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
  })

  it("redirige l'admin sur /admin apres login reussi", () => {
    cy.intercept('POST', `${AUTH_BASE_URL}/api/auth/sign-in/email`, {
      statusCode: 200,
      fixture: 'auth-signin-admin.json',
    }).as('signIn')
    cy.intercept('GET', `${AUTH_BASE_URL}/api/jwt`, {
      statusCode: 200,
      body: { token: jwtFor(ADMIN_EMAIL) },
    }).as('jwt')

    cy.visit('/login')
    cy.get('#login-email').type(ADMIN_EMAIL)
    cy.get('#login-password').type('Sup3rPass!')
    cy.get('button[type="submit"]').contains('Se connecter').click()

    cy.wait('@signIn').its('request.body').should('deep.include', {
      email: ADMIN_EMAIL,
      password: 'Sup3rPass!',
    })
    cy.wait('@jwt')

    cy.location('pathname', { timeout: 10000 }).should('eq', '/admin')
    cy.window().its('localStorage').invoke('getItem', 'healthai.auth.session').should('be.a', 'string')
  })

  it("redirige un utilisateur standard sur / apres login reussi", () => {
    cy.intercept('POST', `${AUTH_BASE_URL}/api/auth/sign-in/email`, {
      statusCode: 200,
      fixture: 'auth-signin-user.json',
    }).as('signIn')
    cy.intercept('GET', `${AUTH_BASE_URL}/api/jwt`, {
      statusCode: 200,
      body: { token: jwtFor(USER_EMAIL) },
    }).as('jwt')

    // Toutes les requetes user lors du chargement de '/' sont mockees pour eviter des appels reseau reels.
    cy.intercept('GET', '**/api/v1/**', { statusCode: 200, body: {} })

    cy.visit('/login')
    cy.get('#login-email').type(USER_EMAIL)
    cy.get('#login-password').type('Sup3rPass!')
    cy.get('button[type="submit"]').contains('Se connecter').click()

    cy.wait('@signIn')
    cy.wait('@jwt')

    cy.location('pathname', { timeout: 10000 }).should('eq', '/')
  })

  it('affiche une erreur quand MSPR-AUTH refuse les credentials', () => {
    cy.intercept('POST', `${AUTH_BASE_URL}/api/auth/sign-in/email`, {
      statusCode: 401,
      body: { message: 'Identifiants invalides' },
    }).as('signInFail')

    cy.visit('/login')
    cy.get('#login-email').type('ghost@healthai.local')
    cy.get('#login-password').type('wrong-pass')
    cy.get('button[type="submit"]').contains('Se connecter').click()

    cy.wait('@signInFail')
    cy.contains('[role="alert"]', 'Identifiants invalides').should('be.visible')
    cy.location('pathname').should('eq', '/login')
  })
})
