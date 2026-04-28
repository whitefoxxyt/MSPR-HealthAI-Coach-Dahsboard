import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { UserDashboardMetrics, UserProfile } from '@/types'
import { userApi } from '@/services/api'

export const useUserStore = defineStore('user', () => {
  const profile = ref<UserProfile | null>(null)
  const metrics = ref<UserDashboardMetrics | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastUpdated = ref<string | null>(null)

  const calorieProgress = computed(() => {
    if (!metrics.value || metrics.value.caloriesTarget <= 0) return 0
    return Math.min(100, Math.round((metrics.value.caloriesConsumed / metrics.value.caloriesTarget) * 100))
  })

  async function fetchProfile() {
    loading.value = true
    error.value = null
    try {
      profile.value = await userApi.getProfile()
      lastUpdated.value = new Date().toISOString()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Erreur lors du chargement du profil'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchMetrics() {
    loading.value = true
    error.value = null
    try {
      metrics.value = await userApi.getDashboardMetrics()
      lastUpdated.value = new Date().toISOString()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Erreur lors du chargement des métriques'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function hydrateDashboard() {
    await Promise.all([fetchProfile(), fetchMetrics()])
  }

  return {
    profile,
    metrics,
    loading,
    error,
    lastUpdated,
    calorieProgress,
    fetchProfile,
    fetchMetrics,
    hydrateDashboard,
  }
})
