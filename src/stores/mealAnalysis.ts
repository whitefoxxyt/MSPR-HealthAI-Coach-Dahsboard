import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ApiError } from '@/services/apiError'
import {
  mealAnalysisApi,
  type MealAnalysisHistoryItem,
  type MealAnalysisResult,
  type MealType,
} from '@/services/aiNutritionApi'

const HISTORY_CACHE_TTL_MS = 30_000

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

  const history = ref<MealAnalysisHistoryItem[]>([])
  const historyTotal = ref(0)
  const historyLoading = ref(false)
  const historyError = ref<ApiError | null>(null)
  const historyLoadedAt = ref<number | null>(null)

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

  async function loadHistory(limit: number, offset: number): Promise<void> {
    const isInitialPage = offset === 0
    if (
      isInitialPage &&
      historyLoadedAt.value !== null &&
      Date.now() - historyLoadedAt.value < HISTORY_CACHE_TTL_MS
    ) {
      return
    }

    historyLoading.value = true
    historyError.value = null
    try {
      const response = await mealAnalysisApi.listMealAnalyses(limit, offset)
      if (isInitialPage) {
        history.value = response.items
        historyLoadedAt.value = Date.now()
      } else {
        history.value = [...history.value, ...response.items]
      }
      historyTotal.value = response.total
    } catch (e) {
      historyError.value = toApiError(e)
    } finally {
      historyLoading.value = false
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
    history,
    historyTotal,
    historyLoading,
    historyError,
    submitMeal,
    loadHistory,
    reset,
  }
})
