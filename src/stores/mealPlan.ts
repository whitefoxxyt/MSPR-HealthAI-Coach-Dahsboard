import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ApiError } from '@/services/apiError'
import {
  mealPlanApi,
  type LLMBackend,
  type MealPlanRequest,
  type MealPlanResponse,
  type MealPlanSummary,
} from '@/services/aiNutritionApi'
import { useLLMPreferencesStore } from '@/stores/llmPreferences'

export const MEAL_PLAN_TIMEOUTS_MS: Record<LLMBackend, number> = {
  ollama: 5 * 60 * 1000,
  mistral: 30 * 1000,
}

export const MEAL_PLAN_HISTORY_CACHE_TTL_MS = 30_000

function toApiError(e: unknown): ApiError {
  if (e instanceof ApiError) return e
  if (e instanceof Error && e.name === 'AbortError') {
    return new ApiError('Génération interrompue (délai dépassé).', 408)
  }
  const message = e instanceof Error ? e.message : 'Erreur inconnue'
  return new ApiError(message, 0)
}

export const useMealPlanStore = defineStore('mealPlan', () => {
  const currentPlan = ref<MealPlanResponse | null>(null)
  const loading = ref(false)
  const error = ref<ApiError | null>(null)

  const history = ref<MealPlanSummary[]>([])
  const historyTotal = ref(0)
  const historyLoading = ref(false)
  const historyError = ref<ApiError | null>(null)
  const historyCachedAt = ref<number | null>(null)
  const historyLastParams = ref<{ limit: number; offset: number } | null>(null)

  let inflightController: AbortController | null = null

  function reset() {
    currentPlan.value = null
    error.value = null
    loading.value = false
  }

  function abort() {
    if (inflightController) {
      inflightController.abort()
    }
  }

  async function submitPlan(body: MealPlanRequest): Promise<void> {
    const llmStore = useLLMPreferencesStore()
    const backend: LLMBackend = llmStore.effectiveLlm ?? 'ollama'
    const timeoutMs = MEAL_PLAN_TIMEOUTS_MS[backend]

    loading.value = true
    error.value = null

    const controller = new AbortController()
    inflightController = controller
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    try {
      currentPlan.value = await mealPlanApi.generateMealPlan(body, {
        signal: controller.signal,
      })
    } catch (e) {
      error.value = toApiError(e)
    } finally {
      clearTimeout(timer)
      inflightController = null
      loading.value = false
    }
  }

  async function loadHistory(limit: number, offset: number): Promise<void> {
    const last = historyLastParams.value
    const cachedAt = historyCachedAt.value
    const isCacheHit =
      cachedAt !== null &&
      last !== null &&
      last.limit === limit &&
      last.offset === offset &&
      Date.now() - cachedAt < MEAL_PLAN_HISTORY_CACHE_TTL_MS
    if (isCacheHit) return

    historyLoading.value = true
    historyError.value = null

    try {
      const page = await mealPlanApi.listMealPlans(limit, offset)
      if (offset === 0) {
        history.value = page.items
      } else {
        history.value = [...history.value, ...page.items]
      }
      historyTotal.value = page.total
      historyCachedAt.value = Date.now()
      historyLastParams.value = { limit, offset }
    } catch (e) {
      historyError.value = toApiError(e)
    } finally {
      historyLoading.value = false
    }
  }

  return {
    currentPlan,
    loading,
    error,
    submitPlan,
    abort,
    reset,
    history,
    historyTotal,
    historyLoading,
    historyError,
    loadHistory,
  }
})
