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

export interface MealMacros {
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
}

export interface Meal {
  name: string
  macros: MealMacros
  ingredients: string[]
  budget_eur: number
  prep_time_min: number
}

export interface DayPlan {
  day: number
  breakfast: Meal
  lunch: Meal
  dinner: Meal
}

export interface MealPlanResponse {
  days: DayPlan[]
  llm_backend_used: LLMBackend
  total_budget_eur: number
}

export interface MealPlanRequest {
  health_goal?: HealthGoal | null
  diet_type: DietType
  duration_days: number
  allergies: string[]
  budget_eur_per_day?: number | null
}

function authHeaders(): Record<string, string> {
  const token = authSessionManager.getAccessToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
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

export interface GenerateMealPlanOptions {
  signal?: AbortSignal
}

export const mealPlanApi = {
  async generateMealPlan(
    body: MealPlanRequest,
    options: GenerateMealPlanOptions = {},
  ): Promise<MealPlanResponse> {
    const response = await fetch(`${AI_NUTRITION_BASE_URL}/api/v1/generate-meal-plan`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(body),
      signal: options.signal,
    })
    return parseJsonOrThrow<MealPlanResponse>(response)
  },
}

export { ApiError }
