/// <reference types="cypress" />

/**
 * Guard de la zone /admin : non-admin redirige vers / + banner "Espace admin reserve".
 * Admin (email dans VITE_ADMIN_EMAILS) accede sans souci.
 */

describe('Admin guard', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    // Eviter tout appel reseau reel pendant le rendu des vues protegees.
    cy.intercept('GET', '**/api/v1/**', { statusCode: 200, body: {} })
    cy.intercept('GET', '**/api/auth/**', { statusCode: 401, body: {} })
    cy.intercept('GET', '**/api/jwt', { statusCode: 401, body: {} })
  })

  it('redirige un utilisateur standard vers / avec ?denied=admin et affiche le banner', () => {
    cy.visit('/login')
    cy.seedSession('user')

    cy.visit('/admin/data-cleaning')

    cy.location('pathname', { timeout: 6000 }).should('eq', '/')
    cy.location('search').should('include', 'denied=admin')
    cy.get('[data-denied="admin"]')
      .should('be.visible')
      .and('contain.text', 'Espace admin')
  })

  it('laisse passer un admin sur /admin/data-cleaning', () => {
    cy.visit('/login')
    cy.seedSession('admin')

    cy.visit('/admin/data-cleaning')

    cy.location('pathname', { timeout: 6000 }).should('eq', '/admin/data-cleaning')
    cy.location('search').should('not.include', 'denied=admin')
  })

  it('redirige un visiteur non authentifie vers /login', () => {
    cy.visit('/admin/data-cleaning')

    cy.location('pathname', { timeout: 6000 }).should('eq', '/login')
  })
})
