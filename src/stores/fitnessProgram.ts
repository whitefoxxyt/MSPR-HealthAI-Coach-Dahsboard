import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ApiError } from '@/services/apiError'
import { recoFitnessApi, type WorkoutProgram } from '@/services/recoFitnessApi'

const HISTORY_CACHE_TTL_MS = 30_000

function toApiError(e: unknown): ApiError {
  if (e instanceof ApiError) return e
  const message = e instanceof Error ? e.message : 'Erreur inconnue'
  return new ApiError(message, 0)
}

export const useFitnessProgramStore = defineStore('fitnessProgram', () => {
  const program = ref<WorkoutProgram | null>(null)
  const loading = ref(false)
  const error = ref<ApiError | null>(null)

  const history = ref<WorkoutProgram[]>([])
  const historyTotal = ref(0)
  const historyLoading = ref(false)
  const historyError = ref<ApiError | null>(null)

  const lastFetchByKey: Record<string, number> = {}

  function clearError() {
    error.value = null
  }

  async function submitProgram(): Promise<void> {
    loading.value = true
    clearError()
    try {
      program.value = await recoFitnessApi.generateProgram()
    } catch (e) {
      error.value = toApiError(e)
    } finally {
      loading.value = false
    }
  }

  async function loadHistory(limit: number, offset: number, force = false): Promise<void> {
    const key = `${limit}:${offset}`
    const now = Date.now()
    const lastFetched = lastFetchByKey[key]
    if (!force && lastFetched !== undefined && now - lastFetched < HISTORY_CACHE_TTL_MS) {
      return
    }
    historyLoading.value = true
    historyError.value = null
    try {
      const response = await recoFitnessApi.listPrograms(limit, offset)
      if (offset === 0) {
        history.value = response.items
      } else {
        history.value = [...history.value, ...response.items]
      }
      historyTotal.value = response.total
      lastFetchByKey[key] = Date.now()
    } catch (e) {
      historyError.value = toApiError(e)
    } finally {
      historyLoading.value = false
    }
  }

  function findProgramById(id: string): WorkoutProgram | null {
    return history.value.find((p) => p.program_id === id) ?? null
  }

  return {
    program,
    loading,
    error,
    history,
    historyTotal,
    historyLoading,
    historyError,
    submitProgram,
    clearError,
    loadHistory,
    findProgramById,
  }
})
