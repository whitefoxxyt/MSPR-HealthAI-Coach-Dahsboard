import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { ActivitySummary } from '@/types'
import { userApi } from '@/services/api'

export const useActivityStore = defineStore('activity', () => {
  const summary = ref<ActivitySummary | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastUpdated = ref<string | null>(null)

  const stepsProgress = computed(() => {
    if (!summary.value || summary.value.stepsTarget <= 0) return 0
    return Math.min(100, Math.round((summary.value.steps / summary.value.stepsTarget) * 100))
  })

  async function fetchActivitySummary() {
    loading.value = true
    error.value = null
    try {
      summary.value = await userApi.getActivitySummary()
      lastUpdated.value = new Date().toISOString()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Erreur lors du chargement activité'
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    summary,
    loading,
    error,
    lastUpdated,
    stepsProgress,
    fetchActivitySummary,
  }
})
