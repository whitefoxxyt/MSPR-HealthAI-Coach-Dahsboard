import { authSessionManager } from '@/services/auth'
import { ApiError, parseJsonOrThrow } from '@/services/apiError'

const AI_NUTRITION_BASE_URL = import.meta.env.VITE_AI_NUTRITION_BASE_URL || 'http://localhost:8001'
const PREFERENCES_PATH = '/api/v1/me/preferences'
const ANALYZE_MEAL_PATH = '/api/v1/analyze-meal'

export type LLMBackend = 'mistral' | 'ollama'

export interface LLMPreferencesView {
  preferred_llm: LLMBackend | null
  effective_llm: LLMBackend
}

export type HealthGoal = 'weight_loss' | 'muscle_gain' | 'balance' | 'sport_performance'

export type DietType = 'omnivore' | 'vegetarien' | 'vegan' | 'sans_gluten'

export type Gender = 'male' | 'female'
export type ActivityLevel =
  | 'sedentary'
  | 'light'
  | 'moderate'
  | 'active'
  | 'very_active'

export interface NutritionGoals {
  user_id: string
  health_goal: HealthGoal | null
  calories_target: number | null
  protein_g: string | null
  carbs_g: string | null
  fat_g: string | null
  allergies: string[]
  diet_type: DietType | string | null
  gender?: Gender | null
  age?: number | null
  weight_kg?: string | number | null
  height_cm?: string | number | null
  activity_level?: ActivityLevel | null
}

export interface NutritionGoalsUpdate {
  health_goal?: HealthGoal | null
  calories_target?: number | null
  protein_g?: number | null
  carbs_g?: number | null
  fat_g?: number | null
  allergies?: string[]
  diet_type?: DietType | null
  gender?: Gender | null
  age?: number | null
  weight_kg?: number | null
  height_cm?: number | null
  activity_level?: ActivityLevel | null
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
  name?: string
  label?: string
  confidence: number
  nutrition?: unknown
}

export interface MealMacros {
  calories?: number | null
  protein_g?: number | null
  carbs_g?: number | null
  fat_g?: number | null
  fiber_g?: number | null
}

export interface Meal {
  name: string
  macros: MealMacros
  ingredients: string[]
  est_budget_eur: number
  prep_time_min: number
}

export interface DayPlan {
  day: number
  meals: Meal[]
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

export interface MealPlanSummary {
  id: string
  created_at: string
  health_goal: HealthGoal | null
  diet_type: DietType | string
  duration_days: number
  total_budget_eur: number
  llm_backend_used: LLMBackend
  days: DayPlan[]
}

export interface MealPlanListResponse {
  items: MealPlanSummary[]
  total: number
  limit: number
  offset: number
}

export interface MealAnalysisResult {
  analysis_id?: number
  detected_foods: DetectedFood[]
  macros: MealMacros
  insight?: string
  recommendations?: string[]
  llm_backend_used?: LLMBackend
  profile_completion_required?: boolean
  missing_fields?: string[]
  fallback?: boolean
  imbalances?: unknown[]
  warnings?: string[]
}

export interface MealAnalysisHistoryItem {
  id: string
  created_at: string
  meal_type: MealType | string | null
  image_url: string | null
  detected_foods: DetectedFood[]
  macros: MealMacros
  insight: string
  llm_backend_used: LLMBackend
}

export interface MealAnalysesListResponse {
  items: MealAnalysisHistoryItem[]
  total: number
  limit: number
  offset: number
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
    body.append('photo', file)
    if (mealType) {
      body.append('meal_type', mealType)
    }
    const response = await fetch(`${AI_NUTRITION_BASE_URL}${ANALYZE_MEAL_PATH}`, {
      method: 'POST',
      headers: multipartAuthHeaders(),
      body,
    })
    return parseJsonOrThrow<MealAnalysisResult>(response)
  },

  async listMealAnalyses(limit: number, offset: number): Promise<MealAnalysesListResponse> {
    const url = `${AI_NUTRITION_BASE_URL}/api/v1/meal-analyses/me?limit=${limit}&offset=${offset}`
    const response = await fetch(url, {
      method: 'GET',
      headers: authHeaders(),
    })
    return parseJsonOrThrow<MealAnalysesListResponse>(response)
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

  async listMealPlans(limit: number, offset: number): Promise<MealPlanListResponse> {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
    })
    const response = await fetch(
      `${AI_NUTRITION_BASE_URL}/api/v1/meal-plans/me?${params.toString()}`,
      {
        method: 'GET',
        headers: authHeaders(),
      },
    )
    return parseJsonOrThrow<MealPlanListResponse>(response)
  },
}

export { ApiError }
