/// <reference types="cypress" />

/**
 * Formulaire plan repas (objectif, regime, duree, allergies) → POST mocke → calendrier rendu.
 */

const AI_NUTRITION_BASE_URL = Cypress.env('AI_NUTRITION_BASE_URL') as string

describe('Meal plan generation', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    cy.visit('/login')
    cy.seedSession('user')

    cy.intercept('GET', `${AI_NUTRITION_BASE_URL}/api/v1/nutrition-goals/me`, {
      statusCode: 200,
      fixture: 'nutrition-goals.json',
    }).as('getGoals')
    cy.intercept('GET', `${AI_NUTRITION_BASE_URL}/api/v1/me/preferences`, {
      statusCode: 200,
      body: { preferred_llm: 'mistral', effective_llm: 'mistral' },
    })
    cy.intercept('POST', `${AI_NUTRITION_BASE_URL}/api/v1/generate-meal-plan`, {
      statusCode: 200,
      fixture: 'meal-plan.json',
    }).as('generatePlan')
  })

  it('rend le calendrier apres soumission du formulaire', () => {
    cy.visit('/meal-plan')
    cy.wait('@getGoals')

    cy.get('[data-testid="meal-plan-form"]').should('be.visible')

    cy.get('[data-testid="form-health-goal"] select').select('muscle_gain')
    cy.get('[data-testid="form-diet-type"] select').select('vegetarien')

    cy.get('[data-testid="form-duration"] input').clear().type('2')

    // Selectionne l'allergie "Gluten" via le chip.
    cy.get('[data-testid="form-allergies"]').contains('button', 'Gluten').click()

    cy.get('[data-testid="meal-plan-form"]').contains('button', 'Générer le plan').click()

    cy.wait('@generatePlan').then(({ request }) => {
      expect(request.body).to.deep.include({
        health_goal: 'muscle_gain',
        diet_type: 'vegetarien',
        duration_days: 2,
      })
      expect(request.body.allergies).to.include('gluten')
    })

    cy.get('[data-testid="meal-plan-result"]', { timeout: 10000 }).should('be.visible')
    cy.get('[data-testid="meal-calendar-grid"]').should('be.visible')
    cy.get('[data-testid="meal-day"]').should('have.length', 2)
    cy.get('[data-testid="meal-day"]').first().within(() => {
      cy.contains('Jour 1').should('be.visible')
      cy.get('[data-testid="meal-breakfast"]').should('contain.text', 'Porridge')
      cy.get('[data-testid="meal-lunch"]').should('contain.text', 'Bowl quinoa')
      cy.get('[data-testid="meal-dinner"]').should('contain.text', 'Saumon')
    })

    cy.get('[data-testid="meal-plan-footer"]')
      .should('contain.text', 'mistral')
      .and('contain.text', '24.5 €')
  })
})
