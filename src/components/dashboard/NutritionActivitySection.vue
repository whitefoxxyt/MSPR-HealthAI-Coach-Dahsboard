<template>
  <section class="na-section" aria-labelledby="na-title">
    <header class="section-header">
      <div>
        <h2 id="na-title" class="section-title">Nutrition &amp; Activité</h2>
        <p class="section-subtitle">Analyse nutritionnelle et physique des utilisateurs</p>
      </div>
    </header>

    <div class="charts-grid">
      <figure class="chart-card">
        <figcaption class="chart-card__title">Déficits / Excès par profil</figcaption>
        <div class="chart-wrap">
          <canvas ref="nutritionCanvas" role="img" aria-label="Graphique des déficits et excès nutritionnels par profil utilisateur" />
        </div>
      </figure>

      <figure class="chart-card">
        <figcaption class="chart-card__title">Exercices les plus pratiqués</figcaption>
        <div class="chart-wrap">
          <canvas ref="exercisesCanvas" role="img" aria-label="Graphique en barres des exercices les plus pratiqués" />
        </div>
      </figure>

      <figure class="chart-card">
        <figcaption class="chart-card__title">Niveaux d'intensité</figcaption>
        <div class="chart-wrap">
          <canvas ref="intensityCanvas" role="img" aria-label="Diagramme circulaire de la répartition des niveaux d'intensité des exercices" />
        </div>
      </figure>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import Chart from 'chart.js/auto'
import type { AnalyticsOverview } from '@/types'

const props = defineProps<{
  analytics: AnalyticsOverview
}>()

const nutritionCanvas = ref<HTMLCanvasElement | null>(null)
const exercisesCanvas = ref<HTMLCanvasElement | null>(null)
const intensityCanvas = ref<HTMLCanvasElement | null>(null)

let nutritionChart: Chart<'bar'> | null = null
let exercisesChart: Chart<'bar'> | null = null
let intensityChart: Chart<'doughnut'> | null = null

function renderNutrition() {
  if (!nutritionCanvas.value) return
  nutritionChart?.destroy()
  nutritionChart = new Chart(nutritionCanvas.value, {
    type: 'bar',
    data: {
      labels: props.analytics.nutritionBalanceByProfile.map(i => i.profile),
      datasets: [
        {
          label: 'Déficits',
          data: props.analytics.nutritionBalanceByProfile.map(i => i.deficit),
          backgroundColor: '#ff9f0a',
          borderRadius: 6,
          borderSkipped: false,
        },
        {
          label: 'Excès',
          data: props.analytics.nutritionBalanceByProfile.map(i => i.excess),
          backgroundColor: '#ff453a',
          borderRadius: 6,
          borderSkipped: false,
        },
      ],
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
      scales: {
        y: {
          beginAtZero: true,
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

function renderExercises() {
  if (!exercisesCanvas.value) return
  exercisesChart?.destroy()
  exercisesChart = new Chart(exercisesCanvas.value, {
    type: 'bar',
    data: {
      labels: props.analytics.topExercises.map(i => i.label),
      datasets: [{
        label: 'Sessions',
        data: props.analytics.topExercises.map(i => i.value),
        backgroundColor: '#bf5af2',
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

function renderIntensity() {
  if (!intensityCanvas.value) return
  intensityChart?.destroy()
  intensityChart = new Chart(intensityCanvas.value, {
    type: 'doughnut',
    data: {
      labels: props.analytics.intensityLevels.map(i => i.label),
      datasets: [{
        data: props.analytics.intensityLevels.map(i => i.value),
        backgroundColor: ['#30d158', '#ff9f0a', '#ff453a'],
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

function renderAll() {
  renderNutrition()
  renderExercises()
  renderIntensity()
}

watch(() => props.analytics, renderAll, { deep: true })
onBeforeUnmount(() => {
  nutritionChart?.destroy()
  exercisesChart?.destroy()
  intensityChart?.destroy()
})
</script>

<style scoped>
.na-section {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.section-header {
  margin-bottom: 0.25rem;
}

.section-title {
  margin: 0 0 0.25rem;
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--c-text);
  padding-left: 0.75rem;
  border-left: 3px solid var(--c-energy);
}

.section-subtitle {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--c-text-muted);
  padding-left: 0.75rem;
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

.chart-card__title {
  display: block;
  margin: 0 0 0.75rem;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--c-text);
}

.chart-wrap {
  height: 220px;
  position: relative;
}
</style>
