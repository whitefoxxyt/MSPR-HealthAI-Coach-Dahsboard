import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:4173',
    specPattern: 'cypress/e2e/**/*.cy.{ts,js}',
    supportFile: 'cypress/support/e2e.ts',
    fixturesFolder: 'cypress/fixtures',
    video: false,
    screenshotOnRunFailure: true,
    viewportWidth: 1280,
    viewportHeight: 800,
    defaultCommandTimeout: 8000,
    requestTimeout: 8000,
    env: {
      AUTH_BASE_URL: 'http://localhost:3000',
      AI_NUTRITION_BASE_URL: 'http://localhost:8001',
      RECO_FITNESS_BASE_URL: 'http://localhost:8002',
      ADMIN_EMAIL: 'admin@healthai.local',
      USER_EMAIL: 'user@healthai.local',
    },
  },
})
