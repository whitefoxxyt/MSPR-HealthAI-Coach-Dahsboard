import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ApiError } from '@/services/apiError'
import {
  mealPlanApi,
  type LLMBackend,
  type MealPlanRequest,
  type MealPlanResponse,
} from '@/services/aiNutritionApi'
import { useLLMPreferencesStore } from '@/stores/llmPreferences'

export const MEAL_PLAN_TIMEOUTS_MS: Record<LLMBackend, number> = {
  ollama: 5 * 60 * 1000,
  mistral: 30 * 1000,
}

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

  return {
    currentPlan,
    loading,
    error,
    submitPlan,
    abort,
    reset,
  }
})
