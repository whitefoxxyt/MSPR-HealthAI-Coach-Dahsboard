import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ApiError } from '@/services/apiError'
import {
  nutritionGoalsApi,
  nutritionMacrosApi,
  type MeMacrosResponse,
  type NutritionGoals,
  type NutritionGoalsUpdate,
} from '@/services/aiNutritionApi'

const CACHE_TTL_MS = 60_000

function toApiError(e: unknown): ApiError {
  if (e instanceof ApiError) return e
  const message = e instanceof Error ? e.message : 'Erreur inconnue'
  return new ApiError(message, 0)
}

export const useNutritionGoalsStore = defineStore('nutritionGoals', () => {
  const goals = ref<NutritionGoals | null>(null)
  const macros = ref<MeMacrosResponse | null>(null)
  const loading = ref(false)
  const macrosLoading = ref(false)
  const error = ref<ApiError | null>(null)
  const macrosError = ref<ApiError | null>(null)

  let lastGoalsFetchedAt: number | null = null
  let lastMacrosFetchedAt: number | null = null

  function clearError() {
    error.value = null
  }

  function clearMacrosError() {
    macrosError.value = null
  }

  async function fetchGoals(force = false): Promise<void> {
    const now = Date.now()
    if (!force && lastGoalsFetchedAt !== null && now - lastGoalsFetchedAt < CACHE_TTL_MS) {
      return
    }
    loading.value = true
    clearError()
    try {
      goals.value = await nutritionGoalsApi.getNutritionGoals()
      lastGoalsFetchedAt = Date.now()
    } catch (e) {
      error.value = toApiError(e)
    } finally {
      loading.value = false
    }
  }

  async function updateGoals(payload: NutritionGoalsUpdate): Promise<void> {
    loading.value = true
    clearError()
    try {
      goals.value = await nutritionGoalsApi.updateNutritionGoals(payload)
      lastGoalsFetchedAt = Date.now()
      lastMacrosFetchedAt = null
    } catch (e) {
      error.value = toApiError(e)
    } finally {
      loading.value = false
    }
  }

  async function fetchMacros(force = false): Promise<void> {
    const now = Date.now()
    if (!force && lastMacrosFetchedAt !== null && now - lastMacrosFetchedAt < CACHE_TTL_MS) {
      return
    }
    macrosLoading.value = true
    clearMacrosError()
    try {
      macros.value = await nutritionMacrosApi.getMacros()
      lastMacrosFetchedAt = Date.now()
    } catch (e) {
      macrosError.value = toApiError(e)
    } finally {
      macrosLoading.value = false
    }
  }

  return {
    goals,
    macros,
    loading,
    macrosLoading,
    error,
    macrosError,
    fetchGoals,
    updateGoals,
    fetchMacros,
    clearError,
    clearMacrosError,
  }
})
