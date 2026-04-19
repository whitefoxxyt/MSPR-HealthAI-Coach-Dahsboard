/**
 * Store Pinia pour la gestion des métriques et anomalies de qualité des données
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  DataQualityMetrics,
  DataAnomaly,
  DataFlowStats,
  PaginationParams,
  AnalyticsOverview,
  EtlReport,
} from '@/types'
import { dataQualityApi } from '@/services/api'

export const useDataQualityStore = defineStore('dataQuality', () => {
  // État
  const metrics = ref<DataQualityMetrics | null>(null)
  const anomalies = ref<DataAnomaly[]>([])
  const dataFlows = ref<DataFlowStats[]>([])
  const analytics = ref<AnalyticsOverview | null>(null)
  const etlReport = ref<EtlReport | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const totalAnomalies = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(10)

  // Getters
  const pendingAnomalies = computed(() => 
    anomalies.value.filter((a) => a.status === 'pending')
  )

  const criticalAnomalies = computed(() =>
    anomalies.value.filter((a) => a.severity === 'high' && a.status === 'pending')
  )

  const healthScore = computed(() => {
    if (!metrics.value) return 0
    const { completenessRate } = metrics.value
    return Math.round(completenessRate)
  })

  const activeDataFlows = computed(() =>
    dataFlows.value.filter((df) => df.status === 'active')
  )

  const errorDataFlows = computed(() =>
    dataFlows.value.filter((df) => df.status === 'error')
  )

  // Actions
  async function fetchMetrics() {
    loading.value = true
    error.value = null
    try {
      metrics.value = await dataQualityApi.getMetrics()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Erreur lors du chargement des métriques'
      console.error('Error fetching metrics:', e)
    } finally {
      loading.value = false
    }
  }

  async function fetchAnomalies(params?: PaginationParams) {
    loading.value = true
    error.value = null
    try {
      const response = await dataQualityApi.getAnomalies(params || {
        page: currentPage.value,
        pageSize: pageSize.value,
      })
      anomalies.value = response.data
      totalAnomalies.value = response.total
      currentPage.value = response.page
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Erreur lors du chargement des anomalies'
      console.error('Error fetching anomalies:', e)
    } finally {
      loading.value = false
    }
  }

  async function fetchDataFlows() {
    loading.value = true
    error.value = null
    try {
      dataFlows.value = await dataQualityApi.getDataFlowStats()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Erreur lors du chargement des flux'
      console.error('Error fetching data flows:', e)
    } finally {
      loading.value = false
    }
  }

  async function fetchAnalytics() {
    loading.value = true
    error.value = null
    try {
      analytics.value = await dataQualityApi.getAnalyticsOverview()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Erreur lors du chargement des analytics'
      console.error('Error fetching analytics:', e)
    } finally {
      loading.value = false
    }
  }

  async function updateAnomaly(id: string, data: Partial<DataAnomaly>) {
    loading.value = true
    error.value = null
    try {
      const updated = await dataQualityApi.updateAnomaly(id, data)
      const index = anomalies.value.findIndex((a) => a.id === id)
      if (index !== -1) {
        anomalies.value[index] = updated
      }
      // Rafraîchir les métriques après modification
      await fetchMetrics()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Erreur lors de la mise à jour'
      console.error('Error updating anomaly:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteAnomaly(id: string) {
    loading.value = true
    error.value = null
    try {
      await dataQualityApi.deleteAnomaly(id)
      anomalies.value = anomalies.value.filter((a) => a.id !== id)
      totalAnomalies.value -= 1
      // Rafraîchir les métriques après suppression
      await fetchMetrics()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Erreur lors de la suppression'
      console.error('Error deleting anomaly:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchEtlReport() {
    loading.value = true
    error.value = null
    try {
      etlReport.value = await dataQualityApi.getEtlReport()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Erreur lors du chargement du rapport ETL'
      console.error('Error fetching ETL report:', e)
    } finally {
      loading.value = false
    }
  }

  async function refreshAll() {
    await Promise.all([
      fetchMetrics(),
      fetchAnomalies(),
      fetchDataFlows(),
      fetchAnalytics(),
      fetchEtlReport(),
    ])
  }

  return {
    // État
    metrics,
    anomalies,
    dataFlows,
    analytics,
    etlReport,
    loading,
    error,
    totalAnomalies,
    currentPage,
    pageSize,
    // Getters
    pendingAnomalies,
    criticalAnomalies,
    healthScore,
    activeDataFlows,
    errorDataFlows,
    // Actions
    fetchMetrics,
    fetchAnomalies,
    fetchDataFlows,
    fetchAnalytics,
    fetchEtlReport,
    updateAnomaly,
    deleteAnomaly,
    refreshAll,
  }
})
