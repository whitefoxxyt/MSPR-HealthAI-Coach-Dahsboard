/// <reference types="cypress" />

/**
 * Upload d'une photo mockee → POST /analyze-meal → macros + insight IA rendus.
 */

const AI_NUTRITION_BASE_URL = Cypress.env('AI_NUTRITION_BASE_URL') as string

describe('Meal analysis', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    cy.visit('/login')
    cy.seedSession('user')

    cy.intercept('POST', `${AI_NUTRITION_BASE_URL}/api/v1/analyze-meal`, (req) => {
      req.reply({
        statusCode: 200,
        fixture: 'meal-analysis.json',
      })
    }).as('analyzeMeal')
  })

  it("rend les macros et l'insight IA apres upload d'une photo", () => {
    cy.visit('/meal-analysis')

    cy.get('[data-testid="dropzone"] input[type="file"]').selectFile(
      'cypress/fixtures/meal-photo.png',
      { force: true },
    )
    cy.get('[data-testid="dropzone-preview"]').should('be.visible')

    cy.get('[data-testid="analyze-button"]').click()

    cy.wait('@analyzeMeal').then(({ request }) => {
      // Le formulaire envoie un multipart contenant file + meal_type.
      expect(request.headers['content-type']).to.match(/multipart\/form-data/)
    })

    cy.get('[data-testid="analysis-result"]', { timeout: 10000 }).should('be.visible')
    cy.get('[data-testid="macros-calories"]').should('contain.text', '615')
    cy.get('[data-testid="macros-protein"]').should('contain.text', '38')
    cy.get('[data-testid="macros-carbs"]').should('contain.text', '54')
    cy.get('[data-testid="macros-fat"]').should('contain.text', '22')

    cy.get('[data-testid="detected-foods"]')
      .should('contain.text', 'Saumon grille')
      .and('contain.text', 'Riz basmati')

    cy.contains(
      'Bonne assiette equilibree',
    ).should('be.visible')
  })
})
