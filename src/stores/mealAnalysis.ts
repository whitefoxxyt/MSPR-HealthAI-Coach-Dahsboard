import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ApiError } from '@/services/apiError'
import {
  mealAnalysisApi,
  type MealAnalysisResult,
  type MealType,
} from '@/services/aiNutritionApi'

function toApiError(e: unknown): ApiError {
  if (e instanceof ApiError) return e
  const message = e instanceof Error ? e.message : 'Erreur inconnue'
  return new ApiError(message, 0)
}

export const useMealAnalysisStore = defineStore('mealAnalysis', () => {
  const analysis = ref<MealAnalysisResult | null>(null)
  const loading = ref(false)
  const error = ref<ApiError | null>(null)
  const lastSubmittedFile = ref<File | null>(null)
  const retryAfter = ref<number | null>(null)

  async function submitMeal(file: File, mealType?: MealType | string): Promise<void> {
    loading.value = true
    error.value = null
    retryAfter.value = null
    lastSubmittedFile.value = file
    try {
      analysis.value = await mealAnalysisApi.analyzeMeal(file, mealType)
    } catch (e) {
      const apiError = toApiError(e)
      error.value = apiError
      if (apiError.status === 429 && apiError.retryAfter !== undefined) {
        retryAfter.value = apiError.retryAfter
      }
    } finally {
      loading.value = false
    }
  }

  function reset(): void {
    analysis.value = null
    error.value = null
    retryAfter.value = null
    lastSubmittedFile.value = null
  }

  return {
    analysis,
    loading,
    error,
    lastSubmittedFile,
    retryAfter,
    submitMeal,
    reset,
  }
})
