<template>
  <section class="dq-section" aria-labelledby="dq-title">
    <header class="dq-section__header">
      <div>
        <h2 id="dq-title" class="section-title">Qualité des données</h2>
        <p class="section-subtitle">Métriques ETL en temps réel</p>
      </div>
      <span class="live-badge" aria-label="Actualisation automatique toutes les 30 secondes">
        <span class="live-dot" aria-hidden="true"></span>
        Temps réel · 30s
      </span>
    </header>

    <div class="kpi-grid">
      <MetricsCard
        title="Enregistrements totaux"
        :value="metrics?.totalRecords ?? 0"
        variant="info"
        subtitle="Dans la base de données"
      >
        <template #icon><span aria-hidden="true">📊</span></template>
      </MetricsCard>

      <MetricsCard
        title="Valeurs manquantes"
        :value="metrics?.missingValues ?? 0"
        variant="warning"
        :trend="metrics && metrics.missingValues < 300 ? '-5%' : '+3%'"
        :trend-direction="metrics && metrics.missingValues < 300 ? 'down' : 'up'"
      >
        <template #icon><span aria-hidden="true">⚠️</span></template>
      </MetricsCard>

      <MetricsCard
        title="Doublons détectés"
        :value="metrics?.duplicates ?? 0"
        variant="info"
        trend="-12%"
        trend-direction="down"
      >
        <template #icon><span aria-hidden="true">🔄</span></template>
      </MetricsCard>

      <MetricsCard
        title="Anomalies critiques"
        :value="criticalAnomaliesCount"
        variant="danger"
        subtitle="Nécessitent une attention"
      >
        <template #icon><span aria-hidden="true">🚨</span></template>
      </MetricsCard>

      <MetricsCard
        title="Taux de complétude"
        :value="metrics?.completenessRate ?? 0"
        :is-percentage="true"
        :variant="completenessVariant"
        trend="+2.5%"
        trend-direction="up"
      >
        <template #icon><span aria-hidden="true">✓</span></template>
      </MetricsCard>

      <MetricsCard
        title="Score de santé"
        :value="healthScore"
        :is-percentage="true"
        :variant="healthScoreVariant"
        subtitle="Qualité globale des données"
      >
        <template #icon><span aria-hidden="true">❤️</span></template>
      </MetricsCard>
    </div>

    <div v-if="metrics" class="chart-card">
      <h3 class="chart-card__title">Vue d'ensemble des problèmes de qualité</h3>
      <div class="chart-wrap">
        <canvas
          ref="chartCanvas"
          role="img"
          aria-label="Graphique en barres des anomalies et problèmes de qualité des données"
        />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import Chart from 'chart.js/auto'
import type { DataQualityMetrics } from '@/types'
import MetricsCard from '@/components/common/MetricsCard.vue'

interface Props {
  metrics: DataQualityMetrics | null
  healthScore: number
  criticalAnomaliesCount: number
  pendingAnomaliesCount: number
  pendingRecordsCount: number
}

const props = defineProps<Props>()

const chartCanvas = ref<HTMLCanvasElement | null>(null)
let chart: Chart<'bar'> | null = null

const completenessVariant = computed(() => {
  const r = props.metrics?.completenessRate ?? 0
  if (r >= 95) return 'success'
  if (r >= 90) return 'warning'
  return 'danger'
})

const healthScoreVariant = computed(() => {
  if (props.healthScore >= 95) return 'success'
  if (props.healthScore >= 85) return 'warning'
  return 'danger'
})

const chartData = computed(() => ({
  labels: ['Manquantes', 'Doublons', 'Anomalies en attente', 'Critiques', 'Validations en attente'],
  values: [
    props.metrics?.missingValues ?? 0,
    props.metrics?.duplicates ?? 0,
    props.pendingAnomaliesCount,
    props.criticalAnomaliesCount,
    props.pendingRecordsCount,
  ],
}))

function render() {
  if (!chartCanvas.value) return
  chart?.destroy()
  chart = new Chart(chartCanvas.value, {
    type: 'bar',
    data: {
      labels: chartData.value.labels,
      datasets: [{
        label: 'Nombre de cas',
        data: chartData.value.values,
        backgroundColor: ['#ff9f0a', '#0a84ff', '#bf5af2', '#ff453a', '#30d158'],
        borderRadius: 6,
        borderSkipped: false,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { precision: 0, color: '#8e8e93' },
          grid: { color: 'rgba(84, 84, 88, 0.40)' },
          border: { color: 'transparent' },
        },
        x: {
          ticks: { color: '#8e8e93' },
          grid: { display: false },
          border: { color: 'transparent' },
        },
      },
    },
  })
}

watch(chartData, render, { deep: true })
watch(() => props.metrics, render)
onBeforeUnmount(() => chart?.destroy())
</script>

<style scoped>
.dq-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.dq-section__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.section-title {
  margin: 0 0 0.25rem;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--c-text);
}

.section-subtitle {
  margin: 0;
  font-size: 0.875rem;
  color: var(--c-text-muted);
}

.live-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.3rem 0.75rem;
  background: var(--c-brand-xlight);
  border: 1px solid rgba(48, 209, 88, 0.25);
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--c-brand);
  white-space: nowrap;
  letter-spacing: 0.01em;
}

.live-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--c-brand);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.8); }
}

@media (prefers-reduced-motion: reduce) {
  .live-dot { animation: none; }
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}

.chart-card {
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--radius);
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
}

.chart-card__title {
  margin: 0 0 1.25rem;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--c-text);
}

.chart-wrap {
  height: 240px;
  position: relative;
}
</style>
