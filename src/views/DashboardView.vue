<template>
  <div class="dashboard">
    <header class="dashboard__header">
      <h1 class="dashboard__title">Dashboard HealthAI Coach</h1>
      <p class="dashboard__subtitle">
        Tableau de bord de pilotage de la qualité des données
      </p>
    </header>

    <div v-if="error || exportError" class="alert alert-error" role="alert">
      <span aria-hidden="true">⚠️</span>
      {{ exportError || error }}
    </div>

    <div v-if="loading && !metrics" class="loading-spinner" role="status">
      <span class="sr-only">Chargement en cours...</span>
      <div class="spinner"></div>
    </div>

    <section v-else class="pilotage-section">
      <header class="section-header">
        <div>
          <h2 class="section-title">Dashboard de pilotage</h2>
          <p class="section-subtitle">Métriques de qualité des données en temps réel</p>
        </div>
        <span class="live-badge">Temps réel · auto 30s</span>
      </header>

      <section class="metrics-grid">
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

      <section v-if="metrics" class="quality-chart-section">
        <h3 class="section-title section-title--small">Qualité des données</h3>
        <p class="chart-description">
          Suivi visuel des indicateurs clés pour identifier rapidement les zones à corriger.
        </p>
        <div class="quality-chart-container">
          <canvas
            ref="qualityChartCanvas"
            role="img"
            aria-label="Graphique des anomalies et problèmes de qualité"
          />
        </div>
      </section>
    </section>

    <section v-if="analytics" class="interactive-dashboard">
      <header class="section-header section-header--interactive">
        <div>
          <h2 class="section-title">Tableau de bord interactif</h2>
          <p class="section-subtitle">
            Qualité des données, progression utilisateurs, tendances nutrition et activité, KPIs business.
          </p>
        </div>
        <label class="period-filter">
          <span class="period-filter__label">Période</span>
          <select v-model="selectedPeriod" class="period-filter__select">
            <option value="7d">7 jours</option>
            <option value="30d">30 jours</option>
            <option value="90d">90 jours</option>
          </select>
        </label>
      </header>

      <section class="analytics-section">
        <h3 class="analytics-section__title">KPIs business</h3>
        <div class="kpi-grid">
          <MetricsCard
            title="Engagement"
            :value="analytics.businessKpis.engagementRate"
            :is-percentage="true"
            variant="success"
            trend="+3.2%"
            trend-direction="up"
          >
            <template #icon>
              <span>🔥</span>
            </template>
          </MetricsCard>
          <MetricsCard
            title="Conversion premium"
            :value="analytics.businessKpis.premiumConversionRate"
            :is-percentage="true"
            variant="info"
            trend="+1.1%"
            trend-direction="up"
          >
            <template #icon>
              <span>💎</span>
            </template>
          </MetricsCard>
          <MetricsCard
            title="Satisfaction"
            :value="analytics.businessKpis.satisfactionRate"
            :is-percentage="true"
            variant="success"
            trend="+0.8%"
            trend-direction="up"
          >
            <template #icon>
              <span>😊</span>
            </template>
          </MetricsCard>
        </div>
      </section>

      <section class="analytics-section">
        <h3 class="analytics-section__title">Métriques utilisateurs</h3>
        <div class="analytics-grid analytics-grid--two">
          <article class="chart-card">
            <h4 class="chart-card__title">Répartition par âge</h4>
            <div class="chart-container">
              <canvas ref="ageDistributionChartCanvas" role="img" aria-label="Répartition des utilisateurs par âge" />
            </div>
          </article>
          <article class="chart-card">
            <h4 class="chart-card__title">Répartition par objectifs</h4>
            <div class="chart-container">
              <canvas
                ref="objectiveDistributionChartCanvas"
                role="img"
                aria-label="Répartition des utilisateurs par objectifs"
              />
            </div>
          </article>
          <article class="chart-card">
            <h4 class="chart-card__title">Taux de progression</h4>
            <p class="progression-rate">{{ formatPercentage(userProgressionRate) }}</p>
            <p class="chart-note">Période : {{ selectedPeriodLabel }}</p>
            <div class="chart-container chart-container--small">
              <canvas ref="progressionTrendChartCanvas" role="img" aria-label="Tendance de progression utilisateurs" />
            </div>
          </article>
        </div>
      </section>

      <section class="analytics-section">
        <h3 class="analytics-section__title">Analyses nutritionnelles</h3>
        <div class="analytics-grid analytics-grid--two">
          <article class="chart-card">
            <h4 class="chart-card__title">Tendances alimentaires</h4>
            <div class="chart-container">
              <canvas ref="foodTrendsChartCanvas" role="img" aria-label="Tendances alimentaires par période" />
            </div>
          </article>
          <article class="chart-card">
            <h4 class="chart-card__title">Déficits/excès par profil</h4>
            <div class="chart-container">
              <canvas
                ref="nutritionBalanceChartCanvas"
                role="img"
                aria-label="Déficits et excès nutritionnels par profil"
              />
            </div>
          </article>
        </div>
      </section>

      <section class="analytics-section">
        <h3 class="analytics-section__title">Statistiques fitness</h3>
        <div class="analytics-grid analytics-grid--two">
          <article class="chart-card">
            <h4 class="chart-card__title">Exercices les plus pratiqués</h4>
            <div class="chart-container">
              <canvas ref="topExercisesChartCanvas" role="img" aria-label="Exercices les plus pratiqués" />
            </div>
          </article>
          <article class="chart-card">
            <h4 class="chart-card__title">Niveaux d'intensité</h4>
            <div class="chart-container">
              <canvas ref="intensityLevelsChartCanvas" role="img" aria-label="Niveaux d'intensité des exercices" />
            </div>
          </article>
        </div>
      </section>
    </section>

    <section v-if="dietStats" class="interactive-dashboard">
      <header class="section-header">
        <div>
          <h2 class="section-title">Recommandations alimentaires</h2>
          <p class="section-subtitle">Données issues du pipeline ETL diet_recommendations</p>
        </div>
      </header>

      <div class="kpi-grid" style="margin-bottom: 1.5rem;">
        <MetricsCard
          title="Patients total"
          :value="dietStats.totalCount"
          variant="info"
          subtitle="Enregistrements diet"
        >
          <template #icon><span>🥗</span></template>
        </MetricsCard>
        <MetricsCard
          title="Adherence moyenne"
          :value="dietStats.avgAdherenceRate"
          :is-percentage="true"
          variant="success"
          subtitle="Suivi du plan alimentaire"
        >
          <template #icon><span>📈</span></template>
        </MetricsCard>
        <MetricsCard
          title="Score déséquilibre"
          :value="dietStats.avgNutrientImbalanceScore"
          variant="warning"
          subtitle="Score moyen d'imbalance nutritionnelle"
        >
          <template #icon><span>⚖️</span></template>
        </MetricsCard>
      </div>

      <div class="analytics-grid analytics-grid--two">
        <article class="chart-card">
          <h4 class="chart-card__title">Répartition par maladie</h4>
          <div class="chart-container">
            <canvas ref="dietDiseaseChartCanvas" role="img" aria-label="Répartition des patients par type de maladie" />
          </div>
        </article>
        <article class="chart-card">
          <h4 class="chart-card__title">Recommandations prescrites</h4>
          <div class="chart-container">
            <canvas ref="dietRecommendationChartCanvas" role="img" aria-label="Distribution des recommandations alimentaires" />
          </div>
        </article>
      </div>
    </section>

    <section v-if="etlReport" class="interactive-dashboard">
      <header class="section-header">
        <div>
          <h2 class="section-title">Rapport ETL</h2>
          <p class="section-subtitle">Dernière exécution : {{ etlReport.generatedAt }}</p>
        </div>
        <div class="etl-totals">
          <span class="etl-stat">Lus : <strong>{{ etlReport.totals.rowsRead }}</strong></span>
          <span class="etl-stat">Insérés : <strong>{{ etlReport.totals.rowsInserted }}</strong></span>
          <span class="etl-stat etl-stat--warn">Rejetés : <strong>{{ etlReport.totals.rowsRejected }}</strong></span>
        </div>
      </header>

      <div class="etl-pipelines">
        <article
          v-for="pipeline in etlReport.pipelines"
          :key="pipeline.name"
          class="etl-pipeline-card"
          :class="{ 'etl-pipeline-card--error': pipeline.status !== 'OK' }"
        >
          <div class="etl-pipeline-header">
            <span class="etl-pipeline-name">{{ pipeline.name }}</span>
            <span class="etl-status-badge" :class="pipeline.status === 'OK' ? 'etl-status-badge--ok' : 'etl-status-badge--err'">
              {{ pipeline.status }}
            </span>
          </div>
          <dl class="etl-pipeline-stats">
            <div class="etl-stat-row"><dt>Lus</dt><dd>{{ pipeline.rowsRead }}</dd></div>
            <div class="etl-stat-row"><dt>Insérés</dt><dd>{{ pipeline.rowsInserted }}</dd></div>
            <div class="etl-stat-row"><dt>Rejetés</dt><dd>{{ pipeline.rowsRejected }}</dd></div>
            <div class="etl-stat-row"><dt>Taux rejet</dt><dd>{{ (pipeline.rejectionRate * 100).toFixed(1) }}%</dd></div>
            <div class="etl-stat-row"><dt>Durée</dt><dd>{{ pipeline.durationS.toFixed(2) }}s</dd></div>
          </dl>
          <div v-if="Object.keys(pipeline.topRejectionReasons).length > 0" class="etl-rejections">
            <p class="etl-rejections-title">Raisons de rejet :</p>
            <ul>
              <li v-for="(count, reason) in pipeline.topRejectionReasons" :key="reason">
                {{ reason }} ({{ count }})
              </li>
            </ul>
          </div>
        </article>
      </div>
    </section>

    <section class="data-flows-section">
      <DataFlowStatus :flows="dataFlows" />
    </section>

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

    <footer class="dashboard__footer">
      <p class="last-update">
        Dernière mise à jour : {{ lastUpdateFormatted }}
      </p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import Chart from 'chart.js/auto'
import { RouterLink } from 'vue-router'
import type { AnalyticsPeriod } from '@/types'
import MetricsCard from '@/components/common/MetricsCard.vue'
import DataFlowStatus from '@/components/dashboard/DataFlowStatus.vue'
import { useDataQualityStore } from '@/stores/dataQuality'
import { useValidationStore } from '@/stores/validation'
import { exportData, formatDate, formatPercentage } from '@/utils/helpers'

const dataQualityStore = useDataQualityStore()
const validationStore = useValidationStore()

const metrics = computed(() => dataQualityStore.metrics)
const dataFlows = computed(() => dataQualityStore.dataFlows)
const analytics = computed(() => dataQualityStore.analytics)
const dietStats = computed(() => dataQualityStore.dietStats)
const etlReport = computed(() => dataQualityStore.etlReport)
const loading = computed(() => dataQualityStore.loading)
const error = computed(() => dataQualityStore.error)
const healthScore = computed(() => dataQualityStore.healthScore)
const criticalAnomaliesCount = computed(() => dataQualityStore.criticalAnomalies.length)
const pendingAnomaliesCount = computed(() => dataQualityStore.pendingAnomalies.length)
const pendingRecordsCount = computed(() => validationStore.pendingCount)

const selectedPeriod = ref<AnalyticsPeriod>('30d')

const qualityChartCanvas = ref<HTMLCanvasElement | null>(null)
const ageDistributionChartCanvas = ref<HTMLCanvasElement | null>(null)
const objectiveDistributionChartCanvas = ref<HTMLCanvasElement | null>(null)
const progressionTrendChartCanvas = ref<HTMLCanvasElement | null>(null)
const foodTrendsChartCanvas = ref<HTMLCanvasElement | null>(null)
const nutritionBalanceChartCanvas = ref<HTMLCanvasElement | null>(null)
const topExercisesChartCanvas = ref<HTMLCanvasElement | null>(null)
const intensityLevelsChartCanvas = ref<HTMLCanvasElement | null>(null)
const dietDiseaseChartCanvas = ref<HTMLCanvasElement | null>(null)
const dietRecommendationChartCanvas = ref<HTMLCanvasElement | null>(null)

let qualityChart: Chart<'bar'> | null = null
let ageDistributionChart: Chart<'doughnut'> | null = null
let objectiveDistributionChart: Chart<'bar'> | null = null
let progressionTrendChart: Chart<'line'> | null = null
let foodTrendsChart: Chart<'line'> | null = null
let nutritionBalanceChart: Chart<'bar'> | null = null
let topExercisesChart: Chart<'bar'> | null = null
let intensityLevelsChart: Chart<'doughnut'> | null = null
let dietDiseaseChart: Chart<'doughnut'> | null = null
let dietRecommendationChart: Chart<'bar'> | null = null
let autoRefreshInterval: ReturnType<typeof setInterval> | null = null

const lastUpdateFormatted = computed(() => {
  return metrics.value?.lastUpdate ? formatDate(metrics.value.lastUpdate) : '-'
})

const selectedPeriodLabel = computed(() => {
  const labels: Record<AnalyticsPeriod, string> = {
    '7d': '7 derniers jours',
    '30d': '30 derniers jours',
    '90d': '90 derniers jours',
  }
  return labels[selectedPeriod.value]
})

const userProgressionRate = computed(() => {
  if (!analytics.value) return 0
  return analytics.value.progressionRateByPeriod[selectedPeriod.value]
})

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

const qualityChartData = computed(() => ({
  labels: [
    'Valeurs manquantes',
    'Doublons',
    'Anomalies en attente',
    'Anomalies critiques',
    'Validations en attente',
  ],
  values: [
    metrics.value?.missingValues || 0,
    metrics.value?.duplicates || 0,
    pendingAnomaliesCount.value,
    criticalAnomaliesCount.value,
    pendingRecordsCount.value,
  ],
}))

async function refreshAll() {
  await Promise.all([
    dataQualityStore.refreshAll(),
    validationStore.fetchRecords(),
  ])
}

function renderQualityChart() {
  if (!qualityChartCanvas.value) return

  if (qualityChart) {
    qualityChart.destroy()
  }

  qualityChart = new Chart(qualityChartCanvas.value, {
    type: 'bar',
    data: {
      labels: qualityChartData.value.labels,
      datasets: [
        {
          label: 'Nombre de cas',
          data: qualityChartData.value.values,
          backgroundColor: ['#f59e0b', '#3b82f6', '#6366f1', '#ef4444', '#14b8a6'],
          borderRadius: 8,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0,
          },
        },
      },
    },
  })
}

function renderAgeDistributionChart() {
  if (!ageDistributionChartCanvas.value || !analytics.value) return
  ageDistributionChart?.destroy()

  ageDistributionChart = new Chart(ageDistributionChartCanvas.value, {
    type: 'doughnut',
    data: {
      labels: analytics.value.ageDistribution.map((item) => item.label),
      datasets: [
        {
          data: analytics.value.ageDistribution.map((item) => item.value),
          backgroundColor: ['#3b82f6', '#2563eb', '#1d4ed8', '#1e40af'],
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
        },
      },
    },
  })
}

function renderObjectiveDistributionChart() {
  if (!objectiveDistributionChartCanvas.value || !analytics.value) return
  objectiveDistributionChart?.destroy()

  objectiveDistributionChart = new Chart(objectiveDistributionChartCanvas.value, {
    type: 'bar',
    data: {
      labels: analytics.value.objectiveDistribution.map((item) => item.label),
      datasets: [
        {
          label: 'Part des utilisateurs (%)',
          data: analytics.value.objectiveDistribution.map((item) => item.value),
          backgroundColor: '#2563eb',
          borderRadius: 8,
        },
      ],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          max: 100,
        },
      },
    },
  })
}

function renderProgressionTrendChart() {
  if (!progressionTrendChartCanvas.value || !analytics.value) return
  progressionTrendChart?.destroy()

  const trend = analytics.value.userProgressionTrend[selectedPeriod.value]
  progressionTrendChart = new Chart(progressionTrendChartCanvas.value, {
    type: 'line',
    data: {
      labels: trend.map((point) => point.label),
      datasets: [
        {
          label: 'Progression (%)',
          data: trend.map((point) => point.value),
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.2)',
          fill: true,
          tension: 0.35,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
        },
      },
    },
  })
}

function renderFoodTrendsChart() {
  if (!foodTrendsChartCanvas.value || !analytics.value) return
  foodTrendsChart?.destroy()

  const trend = analytics.value.foodTrends[selectedPeriod.value]
  foodTrendsChart = new Chart(foodTrendsChartCanvas.value, {
    type: 'line',
    data: {
      labels: trend.map((point) => point.label),
      datasets: [
        {
          label: 'Score alimentaire',
          data: trend.map((point) => point.value),
          borderColor: '#16a34a',
          backgroundColor: 'rgba(22, 163, 74, 0.2)',
          fill: true,
          tension: 0.35,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
        },
      },
    },
  })
}

function renderNutritionBalanceChart() {
  if (!nutritionBalanceChartCanvas.value || !analytics.value) return
  nutritionBalanceChart?.destroy()

  nutritionBalanceChart = new Chart(nutritionBalanceChartCanvas.value, {
    type: 'bar',
    data: {
      labels: analytics.value.nutritionBalanceByProfile.map((item) => item.profile),
      datasets: [
        {
          label: 'Déficits',
          data: analytics.value.nutritionBalanceByProfile.map((item) => item.deficit),
          backgroundColor: '#f59e0b',
          borderRadius: 8,
        },
        {
          label: 'Excès',
          data: analytics.value.nutritionBalanceByProfile.map((item) => item.excess),
          backgroundColor: '#ef4444',
          borderRadius: 8,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
        },
      },
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  })
}

function renderTopExercisesChart() {
  if (!topExercisesChartCanvas.value || !analytics.value) return
  topExercisesChart?.destroy()

  topExercisesChart = new Chart(topExercisesChartCanvas.value, {
    type: 'bar',
    data: {
      labels: analytics.value.topExercises.map((item) => item.label),
      datasets: [
        {
          label: 'Sessions',
          data: analytics.value.topExercises.map((item) => item.value),
          backgroundColor: '#6366f1',
          borderRadius: 8,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  })
}

function renderIntensityLevelsChart() {
  if (!intensityLevelsChartCanvas.value || !analytics.value) return
  intensityLevelsChart?.destroy()

  intensityLevelsChart = new Chart(intensityLevelsChartCanvas.value, {
    type: 'doughnut',
    data: {
      labels: analytics.value.intensityLevels.map((item) => item.label),
      datasets: [
        {
          data: analytics.value.intensityLevels.map((item) => item.value),
          backgroundColor: ['#22c55e', '#f59e0b', '#ef4444'],
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
        },
      },
    },
  })
}

function renderDietDiseaseChart() {
  if (!dietDiseaseChartCanvas.value || !dietStats.value) return
  dietDiseaseChart?.destroy()

  dietDiseaseChart = new Chart(dietDiseaseChartCanvas.value, {
    type: 'doughnut',
    data: {
      labels: dietStats.value.diseaseTypeDistribution.map((item) => item.label),
      datasets: [
        {
          data: dietStats.value.diseaseTypeDistribution.map((item) => item.value),
          backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } },
    },
  })
}

function renderDietRecommendationChart() {
  if (!dietRecommendationChartCanvas.value || !dietStats.value) return
  dietRecommendationChart?.destroy()

  dietRecommendationChart = new Chart(dietRecommendationChartCanvas.value, {
    type: 'bar',
    data: {
      labels: dietStats.value.dietRecommendationDistribution.map((item) => item.label),
      datasets: [
        {
          label: 'Patients',
          data: dietStats.value.dietRecommendationDistribution.map((item) => item.value),
          backgroundColor: '#10b981',
          borderRadius: 8,
        },
      ],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { x: { beginAtZero: true } },
    },
  })
}

function renderAnalyticsCharts() {
  renderAgeDistributionChart()
  renderObjectiveDistributionChart()
  renderProgressionTrendChart()
  renderFoodTrendsChart()
  renderNutritionBalanceChart()
  renderTopExercisesChart()
  renderIntensityLevelsChart()
}

function renderDietCharts() {
  renderDietDiseaseChart()
  renderDietRecommendationChart()
}

const exportError = ref<string | null>(null)

async function handleExport() {
  exportError.value = null
  try {
    await exportData({
      format: 'json',
      includeMetadata: true,
    })
  } catch (e) {
    console.error('Export error:', e)
    exportError.value = e instanceof Error ? e.message : "Impossible d'exporter les données"
    setTimeout(() => {
      exportError.value = null
    }, 5000)
  }
}

watch(qualityChartData, () => {
  renderQualityChart()
}, { deep: true })

watch([analytics, selectedPeriod], () => {
  renderAnalyticsCharts()
}, { deep: true })

watch(dietStats, () => {
  renderDietCharts()
}, { deep: true })

onMounted(async () => {
  await refreshAll()
  renderQualityChart()
  renderAnalyticsCharts()
  renderDietCharts()
  autoRefreshInterval = setInterval(() => {
    void refreshAll()
  }, 30000)
})

onBeforeUnmount(() => {
  qualityChart?.destroy()
  ageDistributionChart?.destroy()
  objectiveDistributionChart?.destroy()
  progressionTrendChart?.destroy()
  foodTrendsChart?.destroy()
  nutritionBalanceChart?.destroy()
  topExercisesChart?.destroy()
  intensityLevelsChart?.destroy()
  dietDiseaseChart?.destroy()
  dietRecommendationChart?.destroy()
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval)
  }
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
  to {
    transform: rotate(360deg);
  }
}

.pilotage-section,
.interactive-dashboard,
.quality-chart-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.section-header--interactive {
  margin-bottom: 2rem;
}

.section-title {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
}

.section-title--small {
  font-size: 1.25rem;
  margin-bottom: 0.75rem;
}

.section-subtitle {
  margin: 0;
  color: #6b7280;
}

.live-badge {
  display: inline-flex;
  align-items: center;
  border-radius: 9999px;
  border: 1px solid #bfdbfe;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.25rem 0.75rem;
}

.period-filter {
  display: grid;
  gap: 0.35rem;
}

.period-filter__label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.period-filter__select {
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #fff;
  padding: 0.5rem 0.75rem;
  font: inherit;
}

.period-filter__select:focus-visible {
  outline: 2px solid #93c5fd;
  outline-offset: 2px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.quality-chart-section {
  margin-bottom: 0;
}

.chart-description {
  margin: 0 0 1rem 0;
  font-size: 0.875rem;
  color: #6b7280;
}

.quality-chart-container {
  height: 320px;
}

.analytics-section {
  margin-bottom: 2rem;
}

.analytics-section:last-of-type {
  margin-bottom: 0;
}

.analytics-section__title {
  margin: 0 0 1rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
}

.kpi-grid,
.analytics-grid {
  display: grid;
  gap: 1rem;
}

.kpi-grid {
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
}

.analytics-grid--two {
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
}

.chart-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  padding: 1rem;
}

.chart-card__title {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
}

.chart-note {
  margin: 0 0 0.5rem 0;
  color: #6b7280;
  font-size: 0.8125rem;
}

.progression-rate {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  color: #1d4ed8;
  line-height: 1;
}

.chart-container {
  height: 260px;
}

.chart-container--small {
  height: 220px;
}

.data-flows-section {
  margin-bottom: 2rem;
}

.quick-actions {
  margin-bottom: 2rem;
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

.etl-totals {
  display: flex;
  gap: 1.5rem;
  align-items: center;
}

.etl-stat {
  font-size: 0.875rem;
  color: #374151;
}

.etl-stat--warn strong {
  color: #dc2626;
}

.etl-pipelines {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
}

.etl-pipeline-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  background: #fff;
}

.etl-pipeline-card--error {
  border-color: #fca5a5;
  background: #fef2f2;
}

.etl-pipeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.etl-pipeline-name {
  font-weight: 600;
  font-size: 0.9375rem;
  color: #111827;
}

.etl-status-badge {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
}

.etl-status-badge--ok {
  background: #dcfce7;
  color: #15803d;
}

.etl-status-badge--err {
  background: #fee2e2;
  color: #b91c1c;
}

.etl-pipeline-stats {
  margin: 0;
  display: grid;
  gap: 0.25rem;
}

.etl-stat-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.8125rem;
}

.etl-stat-row dt {
  color: #6b7280;
}

.etl-stat-row dd {
  margin: 0;
  font-weight: 600;
  color: #111827;
}

.etl-rejections {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid #e5e7eb;
}

.etl-rejections-title {
  margin: 0 0 0.25rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #374151;
}

.etl-rejections ul {
  margin: 0;
  padding-left: 1.25rem;
  font-size: 0.8125rem;
  color: #6b7280;
}

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

  .section-header {
    flex-direction: column;
    align-items: stretch;
  }

  .metrics-grid,
  .kpi-grid,
  .analytics-grid,
  .actions-grid {
    grid-template-columns: 1fr;
  }
}
</style>
