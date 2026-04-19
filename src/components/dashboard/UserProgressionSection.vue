<template>
  <section class="up-section" aria-labelledby="up-title">
    <h2 id="up-title" class="section-title">Progression utilisateurs</h2>

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
          <figcaption class="chart-card__title">
            Taux de progression
            <span class="progression-rate">{{ formatPercentage(progressionRate) }}</span>
          </figcaption>
          <p class="chart-note">{{ periodLabel }}</p>
        </div>
        <div class="chart-wrap">
          <canvas ref="trendCanvas" role="img" :aria-label="`Courbe de tendance de progression sur ${periodLabel}`" />
        </div>
      </figure>
    </div>
  </section>
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

const ageCanvas = ref<HTMLCanvasElement | null>(null)
const objectiveCanvas = ref<HTMLCanvasElement | null>(null)
const trendCanvas = ref<HTMLCanvasElement | null>(null)

let ageChart: Chart<'doughnut'> | null = null
let objectiveChart: Chart<'bar'> | null = null
let trendChart: Chart<'line'> | null = null

const periodLabel = computed(() => {
  const map: Record<AnalyticsPeriod, string> = { '7d': '7 derniers jours', '30d': '30 derniers jours', '90d': '90 derniers jours' }
  return map[props.period]
})

const progressionRate = computed(() => props.analytics.progressionRateByPeriod[props.period])

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
        legend: {
          position: 'bottom',
          labels: { boxWidth: 10, padding: 14, color: '#8e8e93', font: { size: 12 } },
        },
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
        label: 'Part des utilisateurs (%)',
        data: props.analytics.objectiveDistribution.map(i => i.value),
        backgroundColor: '#0a84ff',
        borderRadius: 6,
        borderSkipped: false,
      }],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: {
          beginAtZero: true,
          max: 100,
          ticks: { color: '#8e8e93' },
          grid: { color: 'rgba(84, 84, 88, 0.40)' },
          border: { color: 'transparent' },
        },
        y: {
          ticks: { color: '#8e8e93' },
          grid: { display: false },
          border: { color: 'transparent' },
        },
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
        backgroundColor: 'rgba(48, 209, 88, 0.12)',
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
        y: {
          beginAtZero: true,
          max: 100,
          ticks: { color: '#8e8e93' },
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

function renderAll() {
  renderAge()
  renderObjective()
  renderTrend()
}

watch(() => props.analytics, renderAll, { deep: true })
watch(() => props.period, () => {
  renderTrend()
})
onBeforeUnmount(() => {
  ageChart?.destroy()
  objectiveChart?.destroy()
  trendChart?.destroy()
})
</script>

<style scoped>
.up-section {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.section-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--c-text);
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.chart-card {
  margin: 0;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--radius);
  padding: 1.25rem;
  box-shadow: var(--shadow-sm);
}

.chart-card--wide {
  grid-column: 1 / -1;
}

.chart-card__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}

.chart-card__title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0 0 0.75rem;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--c-text);
}

.chart-card--wide .chart-card__title {
  margin: 0;
}

.progression-rate {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--c-brand);
  font-variant-numeric: tabular-nums;
}

.chart-note {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--c-text-muted);
}

.chart-wrap {
  height: 220px;
  position: relative;
}

.chart-card--wide .chart-wrap {
  height: 180px;
}
</style>
