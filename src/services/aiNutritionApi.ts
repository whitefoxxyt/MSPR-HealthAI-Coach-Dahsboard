import { authSessionManager } from '@/services/auth'
import { ApiError, parseJsonOrThrow } from '@/services/apiError'

const AI_NUTRITION_BASE_URL = import.meta.env.VITE_AI_NUTRITION_BASE_URL || 'http://localhost:8001'
const PREFERENCES_PATH = '/api/v1/me/preferences'

export type LLMBackend = 'mistral' | 'ollama'

export interface LLMPreferencesView {
  preferred_llm: LLMBackend | null
  effective_llm: LLMBackend
}

export type HealthGoal = 'weight_loss' | 'muscle_gain' | 'balance' | 'sport_performance'

export type DietType = 'omnivore' | 'vegetarien' | 'vegan' | 'sans_gluten'

export interface NutritionGoals {
  user_id: string
  health_goal: HealthGoal | null
  calories_target: number | null
  protein_g: string | null
  carbs_g: string | null
  fat_g: string | null
  allergies: string[]
  diet_type: DietType | string | null
}

export interface NutritionGoalsUpdate {
  health_goal?: HealthGoal | null
  calories_target?: number | null
  protein_g?: number | null
  carbs_g?: number | null
  fat_g?: number | null
  allergies?: string[]
  diet_type?: DietType | null
}

export interface MacroTargetsView {
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
}

export interface MeMacrosResponse {
  profile_completion_required: boolean
  missing_fields: string[]
  tdee: number | null
  macros: MacroTargetsView | null
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export interface DetectedFood {
  name: string
  confidence: number
}

export interface MealMacros {
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number
}

export interface MealAnalysisResult {
  detected_foods: DetectedFood[]
  macros: MealMacros
  insight: string
  llm_backend_used: LLMBackend
}

function authHeaders(): Record<string, string> {
  const token = authSessionManager.getAccessToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

function multipartAuthHeaders(): Record<string, string> {
  const token = authSessionManager.getAccessToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
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

export const nutritionGoalsApi = {
  async getNutritionGoals(): Promise<NutritionGoals | null> {
    const response = await fetch(`${AI_NUTRITION_BASE_URL}/api/v1/nutrition-goals/me`, {
      method: 'GET',
      headers: authHeaders(),
    })
    if (response.status === 404) {
      return null
    }
    return parseJsonOrThrow<NutritionGoals>(response)
  },

  async updateNutritionGoals(payload: NutritionGoalsUpdate): Promise<NutritionGoals> {
    const response = await fetch(`${AI_NUTRITION_BASE_URL}/api/v1/nutrition-goals/me`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    })
    return parseJsonOrThrow<NutritionGoals>(response)
  },
}

export const nutritionMacrosApi = {
  async getMacros(): Promise<MeMacrosResponse> {
    const response = await fetch(`${AI_NUTRITION_BASE_URL}/api/v1/me/macros`, {
      method: 'GET',
      headers: authHeaders(),
    })
    return parseJsonOrThrow<MeMacrosResponse>(response)
  },
}

export const mealAnalysisApi = {
  async analyzeMeal(file: File, mealType?: MealType | string): Promise<MealAnalysisResult> {
    const body = new FormData()
    body.append('file', file)
    if (mealType) {
      body.append('meal_type', mealType)
    }
    const response = await fetch(`${AI_NUTRITION_BASE_URL}/api/v1/analyze-meal`, {
      method: 'POST',
      headers: multipartAuthHeaders(),
      body,
    })
    return parseJsonOrThrow<MealAnalysisResult>(response)
  },
}

export { ApiError }
