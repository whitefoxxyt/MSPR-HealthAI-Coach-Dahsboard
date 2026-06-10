/// <reference types="cypress" />

/**
 * Profil fitness charge → bouton "Generer un programme" → POST mocke → programme avec exercices rendu.
 */

const RECO_FITNESS_BASE_URL = Cypress.env('RECO_FITNESS_BASE_URL') as string

describe('Fitness program generation', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    cy.visit('/login')
    cy.seedSession('user')

    cy.intercept('GET', `${RECO_FITNESS_BASE_URL}/api/v1/fitness-profile/me`, {
      statusCode: 200,
      fixture: 'fitness-profile.json',
    }).as('getProfile')

    cy.intercept('POST', `${RECO_FITNESS_BASE_URL}/api/v1/recommendations`, {
      statusCode: 200,
      fixture: 'fitness-program.json',
    }).as('generateProgram')
  })

  it("rend le programme avec ses exercices apres generation", () => {
    cy.visit('/fitness-program')
    cy.wait('@getProfile')

    cy.get('[data-testid="generate-program-cta"]').should('be.visible').click()
    cy.wait('@generateProgram')

    cy.get('[data-testid="program-week-0"]', { timeout: 10000 }).should('be.visible')
    cy.get('[data-testid="program-day-0-0"]').within(() => {
      cy.contains('Jour 1').should('be.visible')
      cy.get('[data-testid="workout-card"]').should('have.length', 2)
      // Les noms d'exercices sont affiches en Title Case par formatExerciseName.
      cy.contains('Developpe Couche Haltere').should('be.visible')
      cy.contains('Rowing Haltere').should('be.visible')
    })
    cy.get('[data-testid="program-day-0-1"]').within(() => {
      cy.contains('Squat Goblet').should('be.visible')
    })

    cy.get('[data-testid="new-program-cta"]').should('be.visible')
    cy.get('[data-testid="program-feedback-cta"]').should('be.visible')
  })
})
