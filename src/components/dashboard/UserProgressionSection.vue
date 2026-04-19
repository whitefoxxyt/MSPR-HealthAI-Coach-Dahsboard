<template>
  <div class="charts-grid">
    <figure class="chart-card">
      <figcaption class="chart-card__title">Répartition par âge</figcaption>
      <div class="chart-wrap">
        <canvas ref="ageCanvas" role="img" aria-label="Diagramme circulaire de répartition des utilisateurs par tranche d'âge" />
      </div>
    </figure>

    <figure class="chart-card">
      <figcaption class="chart-card__title">Objectifs des utilisateurs</figcaption>
      <div class="chart-wrap">
        <canvas ref="objectiveCanvas" role="img" aria-label="Graphique en barres de la répartition des utilisateurs par objectif" />
      </div>
    </figure>

    <figure class="chart-card chart-card--wide">
      <div class="chart-card__header">
        <figcaption class="chart-card__title">Taux de progression</figcaption>
        <div class="chart-card__meta">
          <span class="big-rate">{{ formatPercentage(progressionRate) }}</span>
          <span class="period-note">{{ periodLabel }}</span>
        </div>
      </div>
      <div class="chart-wrap chart-wrap--short">
        <canvas ref="trendCanvas" role="img" :aria-label="`Courbe de tendance de progression sur ${periodLabel}`" />
      </div>
    </figure>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import Chart from 'chart.js/auto'
import type { AnalyticsOverview, AnalyticsPeriod } from '@/types'
import { formatPercentage } from '@/utils/helpers'

const props = defineProps<{
  analytics: AnalyticsOverview
  period: AnalyticsPeriod
}>()

const ageCanvas       = ref<HTMLCanvasElement | null>(null)
const objectiveCanvas = ref<HTMLCanvasElement | null>(null)
const trendCanvas     = ref<HTMLCanvasElement | null>(null)

let ageChart:       Chart<'doughnut'> | null = null
let objectiveChart: Chart<'bar'>      | null = null
let trendChart:     Chart<'line'>     | null = null

const periodLabel = computed(() => {
  const map: Record<AnalyticsPeriod, string> = {
    '7d':  '7 derniers jours',
    '30d': '30 derniers jours',
    '90d': '90 derniers jours',
  }
  return map[props.period]
})

const progressionRate = computed(() => props.analytics.progressionRateByPeriod[props.period])

const CHART_OPTS = {
  tickColor: '#8e8e93' as const,
  gridColor: 'rgba(84,84,88,0.35)' as const,
}

function renderAge() {
  if (!ageCanvas.value) return
  ageChart?.destroy()
  ageChart = new Chart(ageCanvas.value, {
    type: 'doughnut',
    data: {
      labels: props.analytics.ageDistribution.map(i => i.label),
      datasets: [{
        data: props.analytics.ageDistribution.map(i => i.value),
        backgroundColor: ['#30d158', '#0a84ff', '#bf5af2', '#ff9f0a'],
        borderWidth: 0,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 10, padding: 12, color: CHART_OPTS.tickColor, font: { size: 12 } } },
      },
    },
  })
}

function renderObjective() {
  if (!objectiveCanvas.value) return
  objectiveChart?.destroy()
  objectiveChart = new Chart(objectiveCanvas.value, {
    type: 'bar',
    data: {
      labels: props.analytics.objectiveDistribution.map(i => i.label),
      datasets: [{
        label: 'Part (%)',
        data: props.analytics.objectiveDistribution.map(i => i.value),
        backgroundColor: '#0a84ff',
        borderRadius: 5,
        borderSkipped: false,
      }],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { beginAtZero: true, max: 100, ticks: { color: CHART_OPTS.tickColor }, grid: { color: CHART_OPTS.gridColor }, border: { color: 'transparent' } },
        y: { ticks: { color: CHART_OPTS.tickColor }, grid: { display: false }, border: { color: 'transparent' } },
      },
    },
  })
}

function renderTrend() {
  if (!trendCanvas.value) return
  trendChart?.destroy()
  const trend = props.analytics.userProgressionTrend[props.period]
  trendChart = new Chart(trendCanvas.value, {
    type: 'line',
    data: {
      labels: trend.map(p => p.label),
      datasets: [{
        label: 'Progression (%)',
        data: trend.map(p => p.value),
        borderColor: '#30d158',
        backgroundColor: 'rgba(48,209,88,0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: '#30d158',
        borderWidth: 2,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, max: 100, ticks: { color: CHART_OPTS.tickColor }, grid: { color: CHART_OPTS.gridColor }, border: { color: 'transparent' } },
        x: { ticks: { color: CHART_OPTS.tickColor }, grid: { display: false }, border: { color: 'transparent' } },
      },
    },
  })
}

function renderAll() { renderAge(); renderObjective(); renderTrend() }

watch(() => props.analytics, renderAll, { deep: true })
watch(() => props.period, renderTrend)

onBeforeUnmount(() => { ageChart?.destroy(); objectiveChart?.destroy(); trendChart?.destroy() })
</script>

<style scoped>
.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.chart-card {
  margin: 0;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: 0.875rem;
  padding: 1.25rem;
  box-shadow: var(--shadow-sm);
}

.chart-card--wide { grid-column: 1 / -1; }

.chart-card__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.chart-card__title {
  display: block;
  margin: 0 0 0.875rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--c-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.chart-card--wide .chart-card__title { margin: 0; }

.chart-card__meta {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
}

.big-rate {
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--c-brand);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}

.period-note {
  font-size: 0.8125rem;
  color: var(--c-text-muted);
}

.chart-wrap          { height: 220px; position: relative; }
.chart-wrap--short   { height: 160px; }
</style>
