import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { llmPreferencesApi } from '../aiNutritionApi'

const AUTH_STORAGE_KEY = 'healthai.auth.session'
const EXPECTED_URL = 'http://localhost:8001/api/v1/me/preferences'

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function seedAuthSession() {
  localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({
      user: { id: 'u-1', username: 'arthur', email: 'arthur@test.dev', role: 'user' },
      tokens: {
        accessToken: 'jwt-test-token',
        refreshToken: 'refresh',
        expiresAt: '2099-01-01T00:00:00.000Z',
      },
    }),
  )
}

describe('llmPreferencesApi', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    seedAuthSession()
    fetchSpy = vi.spyOn(globalThis, 'fetch')
  })

  afterEach(() => {
    fetchSpy.mockRestore()
    localStorage.removeItem(AUTH_STORAGE_KEY)
  })

  it('GET appelle /api/v1/me/preferences avec Authorization Bearer', async () => {
    fetchSpy.mockResolvedValueOnce(
      jsonResponse({ preferred_llm: null, effective_llm: 'mistral' }),
    )

    await llmPreferencesApi.getPreferences()

    expect(fetchSpy).toHaveBeenCalledWith(
      EXPECTED_URL,
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({ Authorization: 'Bearer jwt-test-token' }),
      }),
    )
  })

  it('PATCH appelle /api/v1/me/preferences avec le backend choisi', async () => {
    fetchSpy.mockResolvedValueOnce(
      jsonResponse({ preferred_llm: 'ollama', effective_llm: 'ollama' }),
    )

    await llmPreferencesApi.updatePreferences('ollama')

    expect(fetchSpy).toHaveBeenCalledWith(
      EXPECTED_URL,
      expect.objectContaining({
        method: 'PATCH',
        headers: expect.objectContaining({
          Authorization: 'Bearer jwt-test-token',
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ preferred_llm: 'ollama' }),
      }),
    )
  })

  it("propage une erreur HTTP en exception explicite", async () => {
    fetchSpy.mockResolvedValueOnce(new Response('boom', { status: 500 }))

    await expect(llmPreferencesApi.getPreferences()).rejects.toThrow(/500/)
  })
})
