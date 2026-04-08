<template>
  <div class="dashboard">
    <header class="dashboard__header">
      <h1 class="dashboard__title">Dashboard HealthAI Coach</h1>
      <p class="dashboard__subtitle">
        Tableau de bord de pilotage de la qualité des données
      </p>
    </header>

    <!-- Message d'erreur -->
    <div v-if="error" class="alert alert-error" role="alert">
      <span aria-hidden="true">⚠️</span>
      {{ error }}
    </div>

    <!-- Indicateur de chargement -->
    <div v-if="loading && !metrics" class="loading-spinner" role="status">
      <span class="sr-only">Chargement en cours...</span>
      <div class="spinner"></div>
    </div>

    <!-- Métriques principales -->
    <section v-else class="metrics-grid">
      <MetricsCard
        title="Enregistrements totaux"
        :value="metrics?.totalRecords || 0"
        variant="info"
        subtitle="Dans la base de données"
      >
        <template #icon>
          <span>📊</span>
        </template>
      </MetricsCard>

      <MetricsCard
        title="Valeurs manquantes"
        :value="metrics?.missingValues || 0"
        variant="warning"
        :trend="getMissingValuesTrend"
        :trend-direction="metrics && metrics.missingValues < 300 ? 'down' : 'up'"
      >
        <template #icon>
          <span>⚠️</span>
        </template>
      </MetricsCard>

      <MetricsCard
        title="Doublons détectés"
        :value="metrics?.duplicates || 0"
        variant="info"
        :trend="getDuplicatesTrend"
        trend-direction="down"
      >
        <template #icon>
          <span>🔄</span>
        </template>
      </MetricsCard>

      <MetricsCard
        title="Anomalies actives"
        :value="criticalAnomaliesCount"
        variant="danger"
        subtitle="Nécessitent une attention"
      >
        <template #icon>
          <span>🚨</span>
        </template>
      </MetricsCard>

      <MetricsCard
        title="Taux de complétude"
        :value="metrics?.completenessRate || 0"
        :is-percentage="true"
        :variant="getCompletenessVariant"
        :trend="getCompletnessTrend"
        :trend-direction="metrics && metrics.completenessRate > 90 ? 'up' : 'down'"
      >
        <template #icon>
          <span>✓</span>
        </template>
      </MetricsCard>

      <MetricsCard
        title="Score de santé"
        :value="healthScore"
        :is-percentage="true"
        :variant="getHealthScoreVariant"
        subtitle="Qualité globale des données"
      >
        <template #icon>
          <span>❤️</span>
        </template>
      </MetricsCard>
    </section>

    <!-- Statut des flux de données -->
    <section class="data-flows-section">
      <DataFlowStatus :flows="dataFlows" />
    </section>

    <!-- Actions rapides -->
    <section class="quick-actions">
      <h2 class="section-title">Actions rapides</h2>
      <div class="actions-grid">
        <RouterLink to="/data-cleaning" class="action-card">
          <span class="action-card__icon" aria-hidden="true">🧹</span>
          <h3 class="action-card__title">Nettoyage des données</h3>
          <p class="action-card__description">
            Corriger les anomalies et normaliser les données
          </p>
          <span class="action-card__badge">{{ pendingAnomaliesCount }} anomalies</span>
        </RouterLink>

        <RouterLink to="/validation" class="action-card">
          <span class="action-card__icon" aria-hidden="true">✓</span>
          <h3 class="action-card__title">Workflow de validation</h3>
          <p class="action-card__description">
            Approuver ou rejeter les données en attente
          </p>
          <span class="action-card__badge">{{ pendingRecordsCount }} en attente</span>
        </RouterLink>

        <button class="action-card action-card--button" @click="handleExport">
          <span class="action-card__icon" aria-hidden="true">📥</span>
          <h3 class="action-card__title">Exporter les données</h3>
          <p class="action-card__description">
            Télécharger les données nettoyées
          </p>
        </button>

        <button class="action-card action-card--button" @click="refreshAll">
          <span class="action-card__icon" aria-hidden="true">🔄</span>
          <h3 class="action-card__title">Actualiser</h3>
          <p class="action-card__description">
            Rafraîchir toutes les métriques
          </p>
        </button>
      </div>
    </section>

    <!-- Dernière mise à jour -->
    <footer class="dashboard__footer">
      <p class="last-update">
        Dernière mise à jour : {{ lastUpdateFormatted }}
      </p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import MetricsCard from '@/components/common/MetricsCard.vue'
import DataFlowStatus from '@/components/dashboard/DataFlowStatus.vue'
import { useDataQualityStore } from '@/stores/dataQuality'
import { useValidationStore } from '@/stores/validation'
import { formatDate } from '@/utils/helpers'
import { exportData } from '@/utils/helpers'

const dataQualityStore = useDataQualityStore()
const validationStore = useValidationStore()

// État réactif depuis les stores
const metrics = computed(() => dataQualityStore.metrics)
const dataFlows = computed(() => dataQualityStore.dataFlows)
const loading = computed(() => dataQualityStore.loading)
const error = computed(() => dataQualityStore.error)
const healthScore = computed(() => dataQualityStore.healthScore)
const criticalAnomaliesCount = computed(() => dataQualityStore.criticalAnomalies.length)
const pendingAnomaliesCount = computed(() => dataQualityStore.pendingAnomalies.length)
const pendingRecordsCount = computed(() => validationStore.pendingCount)

const lastUpdateFormatted = computed(() => {
  return metrics.value?.lastUpdate ? formatDate(metrics.value.lastUpdate) : '-'
})

// Tendances et variants
const getMissingValuesTrend = computed(() => {
  const count = metrics.value?.missingValues || 0
  return count < 250 ? '-5%' : '+3%'
})

const getDuplicatesTrend = computed(() => {
  return '-12%'
})

const getCompletnessTrend = computed(() => {
  return '+2.5%'
})

const getCompletenessVariant = computed(() => {
  const rate = metrics.value?.completenessRate || 0
  if (rate >= 95) return 'success'
  if (rate >= 90) return 'warning'
  return 'danger'
})

const getHealthScoreVariant = computed(() => {
  if (healthScore.value >= 95) return 'success'
  if (healthScore.value >= 85) return 'warning'
  return 'danger'
})

// Actions
async function refreshAll() {
  await Promise.all([
    dataQualityStore.refreshAll(),
    validationStore.fetchRecords(),
  ])
}

async function handleExport() {
  try {
    await exportData({
      format: 'json',
      includeMetadata: true,
    })
  } catch (error) {
    console.error('Export error:', error)
  }
}

// Chargement initial
onMounted(async () => {
  await refreshAll()
})
</script>

<style scoped>
.dashboard {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.dashboard__header {
  margin-bottom: 2rem;
}

.dashboard__title {
  margin: 0 0 0.5rem 0;
  font-size: 2rem;
  font-weight: 700;
  color: #111827;
}

.dashboard__subtitle {
  margin: 0;
  font-size: 1.125rem;
  color: #6b7280;
}

.alert {
  padding: 1rem 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.alert-error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
}

.loading-spinner {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.spinner {
  width: 3rem;
  height: 3rem;
  border: 4px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.data-flows-section {
  margin-bottom: 2rem;
}

.quick-actions {
  margin-bottom: 2rem;
}

.section-title {
  margin: 0 0 1.5rem 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.action-card {
  display: block;
  padding: 1.5rem;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  text-decoration: none;
  color: inherit;
  transition: all 0.2s;
  position: relative;
}

.action-card--button {
  width: 100%;
  text-align: left;
  cursor: pointer;
  font-family: inherit;
}

.action-card:hover {
  border-color: #3b82f6;
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.action-card__icon {
  display: block;
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.action-card__title {
  margin: 0 0 0.5rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
}

.action-card__description {
  margin: 0 0 1rem 0;
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.5;
}

.action-card__badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: #dbeafe;
  color: #1e40af;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.dashboard__footer {
  padding-top: 2rem;
  border-top: 1px solid #e5e7eb;
  text-align: center;
}

.last-update {
  margin: 0;
  font-size: 0.875rem;
  color: #6b7280;
}

/* Accessibilité */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.action-card:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .spinner {
    animation: none;
  }
  
  .action-card {
    transition: none;
  }
  
  .action-card:hover {
    transform: none;
  }
}

@media (max-width: 768px) {
  .dashboard {
    padding: 1rem;
  }
  
  .dashboard__title {
    font-size: 1.5rem;
  }
  
  .metrics-grid,
  .actions-grid {
    grid-template-columns: 1fr;
  }
}
</style>
