import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { NutritionSummary } from '@/types'
import { userApi } from '@/services/api'

export const useNutritionStore = defineStore('nutrition', () => {
  const summary = ref<NutritionSummary | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastUpdated = ref<string | null>(null)

  const hydrationProgress = computed(() => {
    if (!summary.value || summary.value.hydrationTargetLiters <= 0) return 0
    return Math.min(
      100,
      Math.round((summary.value.hydrationLiters / summary.value.hydrationTargetLiters) * 100),
    )
  })

  async function fetchNutritionSummary() {
    loading.value = true
    error.value = null
    try {
      summary.value = await userApi.getNutritionSummary()
      lastUpdated.value = new Date().toISOString()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Erreur lors du chargement nutrition'
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
    hydrationProgress,
    fetchNutritionSummary,
  }
})
