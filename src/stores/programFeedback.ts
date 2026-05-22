import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ApiError } from '@/services/apiError'
import {
  recoFitnessApi,
  type FeedbackItem,
  type ProgramFeedbackBody,
  type ProgramFeedbackResponse,
} from '@/services/recoFitnessApi'

function toApiError(e: unknown): ApiError {
  if (e instanceof ApiError) return e
  const message = e instanceof Error ? e.message : 'Erreur inconnue'
  return new ApiError(message, 0)
}

export const useProgramFeedbackStore = defineStore('programFeedback', () => {
  const list = ref<FeedbackItem[]>([])
  const total = ref(0)
  const loading = ref(false)
  const error = ref<ApiError | null>(null)
  const lastSubmitted = ref<ProgramFeedbackResponse | null>(null)

  function clearError() {
    error.value = null
  }

  function clearLastSubmitted() {
    lastSubmitted.value = null
  }

  async function submit(programId: string, body: ProgramFeedbackBody): Promise<void> {
    loading.value = true
    error.value = null
    lastSubmitted.value = null
    try {
      lastSubmitted.value = await recoFitnessApi.sendProgramFeedback(programId, body)
    } catch (e) {
      error.value = toApiError(e)
    } finally {
      loading.value = false
    }
  }

  async function loadHistory(limit = 20, offset = 0): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const page = await recoFitnessApi.listFeedback(limit, offset)
      list.value = page.items
      total.value = page.total
    } catch (e) {
      error.value = toApiError(e)
    } finally {
      loading.value = false
    }
  }

  return {
    list,
    total,
    loading,
    error,
    lastSubmitted,
    submit,
    loadHistory,
    clearError,
    clearLastSubmitted,
  }
})
