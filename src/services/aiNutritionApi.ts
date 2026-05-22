import { authSessionManager } from '@/services/auth'

const AI_NUTRITION_BASE_URL = import.meta.env.VITE_AI_NUTRITION_BASE_URL || 'http://localhost:8001'
const PREFERENCES_PATH = '/api/v1/me/preferences'

export type LLMBackend = 'mistral' | 'ollama'

export interface LLMPreferencesView {
  preferred_llm: LLMBackend | null
  effective_llm: LLMBackend
}

function authHeaders(): Record<string, string> {
  const token = authSessionManager.getAccessToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function parseJsonOrThrow<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
  return (await response.json()) as T
}

export const llmPreferencesApi = {
  getPreferences(): Promise<LLMPreferencesView> {
    return fetch(`${AI_NUTRITION_BASE_URL}${PREFERENCES_PATH}`, {
      method: 'GET',
      headers: authHeaders(),
    }).then((r) => parseJsonOrThrow<LLMPreferencesView>(r))
  },

  updatePreferences(preferred: LLMBackend | null): Promise<LLMPreferencesView> {
    return fetch(`${AI_NUTRITION_BASE_URL}${PREFERENCES_PATH}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ preferred_llm: preferred }),
    }).then((r) => parseJsonOrThrow<LLMPreferencesView>(r))
  },
}
