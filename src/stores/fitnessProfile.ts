import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ApiError } from '@/services/apiError'
import {
  recoFitnessApi,
  type FitnessProfile,
  type FitnessProfileUpdate,
} from '@/services/recoFitnessApi'

const CACHE_TTL_MS = 60_000

function toApiError(e: unknown): ApiError {
  if (e instanceof ApiError) return e
  const message = e instanceof Error ? e.message : 'Erreur inconnue'
  return new ApiError(message, 0)
}

export const useFitnessProfileStore = defineStore('fitnessProfile', () => {
  const profile = ref<FitnessProfile | null>(null)
  const loading = ref(false)
  const error = ref<ApiError | null>(null)

  let lastFetchedAt: number | null = null

  function clearError() {
    error.value = null
  }

  async function fetchProfile(force = false): Promise<void> {
    const now = Date.now()
    if (!force && lastFetchedAt !== null && now - lastFetchedAt < CACHE_TTL_MS) {
      return
    }
    loading.value = true
    clearError()
    try {
      profile.value = await recoFitnessApi.getFitnessProfile()
      lastFetchedAt = Date.now()
    } catch (e) {
      error.value = toApiError(e)
    } finally {
      loading.value = false
    }
  }

  async function updateProfile(payload: FitnessProfileUpdate): Promise<void> {
    loading.value = true
    clearError()
    try {
      profile.value = await recoFitnessApi.updateFitnessProfile(payload)
      lastFetchedAt = Date.now()
    } catch (e) {
      error.value = toApiError(e)
    } finally {
      loading.value = false
    }
  }

  return {
    profile,
    loading,
    error,
    fetchProfile,
    updateProfile,
    clearError,
  }
})
