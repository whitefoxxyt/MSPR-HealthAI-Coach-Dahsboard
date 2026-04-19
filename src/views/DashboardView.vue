<template>
  <div class="dashboard">
    <header class="dashboard__header">
      <div>
        <h1 class="dashboard__title">Dashboard HealthAI Coach</h1>
        <p class="dashboard__subtitle">Tableau de bord de pilotage de la qualité des données</p>
      </div>
      <label class="period-filter">
        <span class="period-filter__label">Période</span>
        <select v-model="selectedPeriod" class="period-filter__select" aria-label="Sélectionner la période d'analyse">
          <option value="7d">7 jours</option>
          <option value="30d">30 jours</option>
          <option value="90d">90 jours</option>
        </select>
      </label>
    </header>

    <div v-if="exportError || error" class="alert" role="alert">
      <span aria-hidden="true">⚠️</span> {{ exportError || error }}
    </div>

    <div v-if="loading && !metrics" class="loading" role="status">
      <span class="sr-only">Chargement en cours…</span>
      <div class="spinner" aria-hidden="true"></div>
    </div>

    <template v-else>
      <DataQualitySection
        :metrics="metrics"
        :health-score="healthScore"
        :critical-anomalies-count="criticalAnomaliesCount"
        :pending-anomalies-count="pendingAnomaliesCount"
        :pending-records-count="pendingRecordsCount"
      />

      <template v-if="analytics">
        <UserProgressionSection :analytics="analytics" :period="selectedPeriod" />
        <NutritionActivitySection :analytics="analytics" :period="selectedPeriod" />
        <BusinessKpisSection
          :analytics="analytics"
          :flows="dataFlows"
          :pending-anomalies-count="pendingAnomaliesCount"
          :pending-records-count="pendingRecordsCount"
          @export="handleExport"
          @refresh="refreshAll"
        />
      </template>

      <EtlReportSection v-if="etlReport" :report="etlReport" />
    </template>

    <footer class="dashboard__footer">
      <p class="last-update">Dernière mise à jour : {{ lastUpdateFormatted }}</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { AnalyticsPeriod } from '@/types'
import { useDataQualityStore } from '@/stores/dataQuality'
import { useValidationStore } from '@/stores/validation'
import { exportData, formatDate } from '@/utils/helpers'
import DataQualitySection from '@/components/dashboard/DataQualitySection.vue'
import EtlReportSection from '@/components/dashboard/EtlReportSection.vue'
import UserProgressionSection from '@/components/dashboard/UserProgressionSection.vue'
import NutritionActivitySection from '@/components/dashboard/NutritionActivitySection.vue'
import BusinessKpisSection from '@/components/dashboard/BusinessKpisSection.vue'

const dataQualityStore = useDataQualityStore()
const validationStore = useValidationStore()

const metrics = computed(() => dataQualityStore.metrics)
const dataFlows = computed(() => dataQualityStore.dataFlows)
const analytics = computed(() => dataQualityStore.analytics)
const etlReport = computed(() => dataQualityStore.etlReport)
const loading = computed(() => dataQualityStore.loading)
const error = computed(() => dataQualityStore.error)
const healthScore = computed(() => dataQualityStore.healthScore)
const criticalAnomaliesCount = computed(() => dataQualityStore.criticalAnomalies.length)
const pendingAnomaliesCount = computed(() => dataQualityStore.pendingAnomalies.length)
const pendingRecordsCount = computed(() => validationStore.pendingCount)
const lastUpdateFormatted = computed(() => metrics.value?.lastUpdate ? formatDate(metrics.value.lastUpdate) : '-')

const selectedPeriod = ref<AnalyticsPeriod>('30d')
const exportError = ref<string | null>(null)

let autoRefreshInterval: ReturnType<typeof setInterval> | null = null

async function refreshAll() {
  await Promise.all([
    dataQualityStore.refreshAll(),
    validationStore.fetchRecords(),
  ])
}

async function handleExport() {
  exportError.value = null
  try {
    await exportData({ format: 'json', includeMetadata: true })
  } catch (e) {
    exportError.value = e instanceof Error ? e.message : "Impossible d'exporter les données"
    setTimeout(() => { exportError.value = null }, 5000)
  }
}

onMounted(async () => {
  await refreshAll()
  autoRefreshInterval = setInterval(() => { void refreshAll() }, 30000)
})

onBeforeUnmount(() => {
  if (autoRefreshInterval) clearInterval(autoRefreshInterval)
})
</script>

<style scoped>
.dashboard {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

.dashboard__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.dashboard__title {
  margin: 0 0 0.375rem;
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--c-text);
  letter-spacing: -0.02em;
}

.dashboard__subtitle {
  margin: 0;
  font-size: 0.9375rem;
  color: var(--c-text-muted);
}

.period-filter {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.period-filter__label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--c-text-muted);
  white-space: nowrap;
}

.period-filter__select {
  padding: 0.4rem 2rem 0.4rem 0.75rem;
  border: 1px solid var(--c-border);
  border-radius: calc(var(--radius) * 0.75);
  background: var(--c-surface) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%238e8e93' d='M6 8L1 3h10z'/%3E%3C/svg%3E") no-repeat right 0.625rem center;
  appearance: none;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--c-text);
  cursor: pointer;
}

.period-filter__select:focus-visible {
  outline: 2px solid var(--c-brand);
  outline-offset: 2px;
}

.alert {
  padding: 0.875rem 1.25rem;
  background: var(--c-danger-light);
  border: 1px solid rgba(255, 69, 58, 0.35);
  border-radius: var(--radius);
  color: var(--c-danger);
  font-size: 0.9375rem;
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.loading {
  display: flex;
  justify-content: center;
  padding: 4rem 0;
}

.spinner {
  width: 2.5rem;
  height: 2.5rem;
  border: 2px solid var(--c-border);
  border-top-color: var(--c-brand);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (prefers-reduced-motion: reduce) {
  .spinner { animation: none; }
}

.dashboard__footer {
  border-top: 1px solid var(--c-border);
  padding-top: 1rem;
}

.last-update {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--c-text-muted);
  text-align: right;
}
</style>
