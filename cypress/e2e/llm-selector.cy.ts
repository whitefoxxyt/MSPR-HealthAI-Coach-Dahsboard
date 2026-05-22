/// <reference types="cypress" />

/**
 * Page /parametres → bascule Mistral → Ollama via le LLMSelector.
 * Verifie : PATCH /me/preferences appele, payload correct, persistance apres reload.
 */

const AI_NUTRITION_BASE_URL = Cypress.env('AI_NUTRITION_BASE_URL') as string

describe('LLM selector', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    cy.visit('/login')
    cy.seedSession('user')
  })

  it('bascule Mistral → Ollama, persiste apres reload', () => {
    let currentPreference: 'mistral' | 'ollama' = 'mistral'

    cy.intercept('GET', `${AI_NUTRITION_BASE_URL}/api/v1/me/preferences`, (req) => {
      const fixture =
        currentPreference === 'mistral'
          ? 'llm-preferences-mistral.json'
          : 'llm-preferences-ollama.json'
      req.reply({ statusCode: 200, fixture })
    }).as('getPrefs')

    cy.intercept('PATCH', `${AI_NUTRITION_BASE_URL}/api/v1/me/preferences`, (req) => {
      const body = req.body as { preferred_llm: 'mistral' | 'ollama' }
      currentPreference = body.preferred_llm
      req.reply({
        statusCode: 200,
        body: { preferred_llm: body.preferred_llm, effective_llm: body.preferred_llm },
      })
    }).as('patchPrefs')

    cy.visit('/parametres')
    cy.wait('@getPrefs')

    // Mistral coche par defaut.
    cy.get('input[type="radio"][value="mistral"]').should('be.checked')
    cy.get('input[type="radio"][value="ollama"]').should('not.be.checked')

    cy.get('input[type="radio"][value="ollama"]').check()

    cy.wait('@patchPrefs').its('request.body').should('deep.equal', {
      preferred_llm: 'ollama',
    })

    cy.get('input[type="radio"][value="ollama"]').should('be.checked')
    cy.contains('Backend actuel').should('contain.text', 'gemma3:4b')

    // Reload : la preference doit etre restituee par le GET.
    cy.reload()
    cy.wait('@getPrefs')
    cy.get('input[type="radio"][value="ollama"]').should('be.checked')
    cy.get('input[type="radio"][value="mistral"]').should('not.be.checked')
  })
})
