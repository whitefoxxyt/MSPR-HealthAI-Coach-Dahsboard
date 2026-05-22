import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ApiError } from '@/services/apiError'
import { recoFitnessApi, type WorkoutProgram } from '@/services/recoFitnessApi'

function toApiError(e: unknown): ApiError {
  if (e instanceof ApiError) return e
  const message = e instanceof Error ? e.message : 'Erreur inconnue'
  return new ApiError(message, 0)
}

export const useFitnessProgramStore = defineStore('fitnessProgram', () => {
  const program = ref<WorkoutProgram | null>(null)
  const loading = ref(false)
  const error = ref<ApiError | null>(null)

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

  return {
    program,
    loading,
    error,
    submitProgram,
    clearError,
  }
})
