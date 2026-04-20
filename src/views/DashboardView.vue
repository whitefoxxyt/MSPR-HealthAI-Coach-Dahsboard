<template>
  <div class="dashboard">

    <!-- Header -->
    <header class="db-header">
      <div class="db-header__brand">
        <h1 class="db-header__title">HealthAI Coach</h1>
        <p class="db-header__sub">Tableau de bord de pilotage</p>
      </div>
      <div class="db-header__controls">
        <label class="period-label" for="period-select">
          <span class="period-label__text">Période</span>
          <select
            id="period-select"
            v-model="selectedPeriod"
            class="period-select"
            aria-label="Sélectionner la période d'analyse"
          >
            <option value="7d">7 jours</option>
            <option value="30d">30 jours</option>
            <option value="90d">90 jours</option>
          </select>
        </label>
        <button class="btn btn--ghost" type="button" :disabled="loading" @click="refreshAll" aria-label="Actualiser les données">
          <font-awesome-icon :icon="['fas', 'arrows-rotate']" :class="{ spinning: loading }" aria-hidden="true" />
          Actualiser
        </button>
      </div>
    </header>

    <!-- Action bar -->
    <nav class="action-bar" aria-label="Actions principales">
      <RouterLink to="/data-cleaning" class="action-btn action-btn--warn">
        <font-awesome-icon :icon="['fas', 'wand-magic-sparkles']" aria-hidden="true" />
        <span>Nettoyage interactif</span>
        <span v-if="pendingAnomaliesCount > 0" class="action-badge" aria-label="{{ pendingAnomaliesCount }} anomalies en attente">
          {{ pendingAnomaliesCount }}
        </span>
      </RouterLink>
      <RouterLink to="/validation" class="action-btn action-btn--info">
        <font-awesome-icon :icon="['fas', 'shield-check']" aria-hidden="true" />
        <span>Workflow de validation</span>
        <span v-if="pendingRecordsCount > 0" class="action-badge" aria-label="{{ pendingRecordsCount }} enregistrements en attente">
          {{ pendingRecordsCount }}
        </span>
      </RouterLink>
      <button class="action-btn action-btn--muted" type="button" @click="handleExport">
        <font-awesome-icon :icon="['fas', 'file-export']" aria-hidden="true" />
        <span>Exporter les données</span>
      </button>
    </nav>

    <!-- Alert -->
    <Transition name="alert">
      <div v-if="exportError || error" class="alert" role="alert" aria-live="assertive">
        <font-awesome-icon :icon="['fas', 'triangle-exclamation']" aria-hidden="true" />
        {{ exportError || error }}
      </div>
    </Transition>

    <!-- Loading -->
    <div v-if="loading && !metrics" class="loading" role="status">
      <span class="sr-only">Chargement en cours…</span>
      <div class="spinner" aria-hidden="true"></div>
      <p class="loading__text" aria-hidden="true">Chargement des données…</p>
    </div>

    <!-- Sections -->
    <template v-else>

      <!-- 01 — Qualité des données -->
      <section class="db-section" aria-labelledby="s1-title">
        <header class="db-section__header">
          <span class="db-section__num" aria-hidden="true">01</span>
          <div class="db-section__info">
            <h2 id="s1-title" class="db-section__title">Qualité des données</h2>
            <p class="db-section__desc">Métriques ETL · Flux de données · Pipelines</p>
          </div>
          <span class="live-badge" aria-label="Actualisation automatique toutes les 30 secondes">
            <span class="live-dot" aria-hidden="true"></span>
            Temps réel
          </span>
        </header>
        <DataQualitySection
          :metrics="metrics"
          :health-score="healthScore"
          :critical-anomalies-count="criticalAnomaliesCount"
          :pending-anomalies-count="pendingAnomaliesCount"
          :pending-records-count="pendingRecordsCount"
          :etl-report="etlReport"
          :flows="dataFlows"
        />
      </section>

      <!-- 02 — Progression utilisateurs -->
      <section v-if="analytics" class="db-section" aria-labelledby="s2-title">
        <header class="db-section__header">
          <span class="db-section__num" aria-hidden="true">02</span>
          <div class="db-section__info">
            <h2 id="s2-title" class="db-section__title">Progression utilisateurs</h2>
            <p class="db-section__desc">Répartition démographique · Objectifs · Tendances sur {{ periodLabel }}</p>
          </div>
        </header>
        <UserProgressionSection :analytics="analytics" :period="selectedPeriod" />
      </section>

      <!-- 03 — Nutrition & Activité -->
      <section v-if="analytics" class="db-section" aria-labelledby="s3-title">
        <header class="db-section__header">
          <span class="db-section__num" aria-hidden="true">03</span>
          <div class="db-section__info">
            <h2 id="s3-title" class="db-section__title">Nutrition &amp; Activité</h2>
            <p class="db-section__desc">Bilans nutritionnels · Exercices pratiqués · Niveaux d'intensité</p>
          </div>
        </header>
        <NutritionActivitySection :analytics="analytics" />
      </section>

      <!-- 04 — KPIs Business -->
      <section v-if="analytics" class="db-section" aria-labelledby="s4-title">
        <header class="db-section__header">
          <span class="db-section__num" aria-hidden="true">04</span>
          <div class="db-section__info">
            <h2 id="s4-title" class="db-section__title">KPIs Business</h2>
            <p class="db-section__desc">Engagement · Conversion premium · Satisfaction utilisateurs</p>
          </div>
        </header>
        <BusinessKpisSection :analytics="analytics" />
      </section>

    </template>

    <footer class="db-footer">
      <p class="db-footer__text">Dernière mise à jour : <time>{{ lastUpdateFormatted }}</time></p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import type { AnalyticsPeriod } from '@/types'
import { useDataQualityStore } from '@/stores/dataQuality'
import { useValidationStore } from '@/stores/validation'
import { exportData, formatDate } from '@/utils/helpers'
import DataQualitySection from '@/components/dashboard/DataQualitySection.vue'
import UserProgressionSection from '@/components/dashboard/UserProgressionSection.vue'
import NutritionActivitySection from '@/components/dashboard/NutritionActivitySection.vue'
import BusinessKpisSection from '@/components/dashboard/BusinessKpisSection.vue'

const dataQualityStore = useDataQualityStore()
const validationStore = useValidationStore()

const metrics       = computed(() => dataQualityStore.metrics)
const dataFlows     = computed(() => dataQualityStore.dataFlows)
const analytics     = computed(() => dataQualityStore.analytics)
const etlReport     = computed(() => dataQualityStore.etlReport)
const loading       = computed(() => dataQualityStore.loading)
const error         = computed(() => dataQualityStore.error)
const healthScore   = computed(() => dataQualityStore.healthScore)
const criticalAnomaliesCount = computed(() => dataQualityStore.criticalAnomalies.length)
const pendingAnomaliesCount  = computed(() => dataQualityStore.pendingAnomalies.length)
const pendingRecordsCount    = computed(() => validationStore.pendingCount)
const lastUpdateFormatted    = computed(() =>
  metrics.value?.lastUpdate ? formatDate(metrics.value.lastUpdate) : '—',
)

const selectedPeriod = ref<AnalyticsPeriod>('30d')
const exportError    = ref<string | null>(null)

const periodLabel = computed(() => {
  const map: Record<AnalyticsPeriod, string> = {
    '7d': '7 derniers jours',
    '30d': '30 derniers jours',
    '90d': '90 derniers jours',
  }
  return map[selectedPeriod.value]
})

let autoRefreshInterval: ReturnType<typeof setInterval> | null = null

async function refreshAll() {
  await Promise.all([dataQualityStore.refreshAll(), validationStore.fetchRecords()])
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
/* ── Layout ── */
.dashboard {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem 2rem 3rem;
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* ── Header ── */
.db-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  flex-wrap: wrap;
  padding-bottom: 1.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid var(--c-border);
}

.db-header__title {
  margin: 0 0 0.2rem;
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--c-text);
  letter-spacing: -0.025em;
}

.db-header__sub {
  margin: 0;
  font-size: 0.875rem;
  color: var(--c-text-muted);
}

.db-header__controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.period-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.period-label__text {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--c-text-muted);
}

.period-select {
  padding: 0.4rem 2rem 0.4rem 0.75rem;
  border: 1px solid var(--c-border);
  border-radius: 0.5rem;
  background: var(--c-surface-2) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%238e8e93' d='M6 8L1 3h10z'/%3E%3C/svg%3E") no-repeat right 0.625rem center;
  appearance: none;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--c-text);
  cursor: pointer;
  transition: border-color 0.15s;
}
.period-select:hover         { border-color: rgba(255,255,255,.18); }
.period-select:focus-visible { outline: 2px solid var(--c-brand); outline-offset: 2px; }

/* ── Generic button ── */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.875rem;
  border: 1px solid var(--c-border);
  border-radius: 0.5rem;
  font: inherit;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}

.btn--ghost {
  background: transparent;
  color: var(--c-text-muted);
}
.btn--ghost:hover:not(:disabled) { background: var(--c-surface-2); color: var(--c-text); }
.btn--ghost:disabled              { opacity: 0.5; cursor: not-allowed; }
.btn:focus-visible                { outline: 2px solid var(--c-brand); outline-offset: 2px; }

@keyframes spin { to { transform: rotate(360deg); } }
.spinning { animation: spin 0.8s linear infinite; }

/* ── Action bar ── */
.action-bar {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-bottom: 2.5rem;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.625rem 1.125rem;
  border-radius: 0.625rem;
  border: 1px solid transparent;
  font: inherit;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s;
}
.action-btn:hover       { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,.4); }
.action-btn:active      { transform: translateY(0); }
.action-btn:focus-visible { outline: 2px solid var(--c-brand); outline-offset: 2px; }

.action-btn--warn  { background: var(--c-energy); color: #000; }
.action-btn--info  { background: var(--c-info-strong); color: #fff; }
.action-btn--muted { background: var(--c-surface); color: var(--c-text); border-color: var(--c-border); }
.action-btn--muted:hover { background: var(--c-surface-2); }

.action-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.375rem;
  height: 1.375rem;
  padding: 0 0.3rem;
  border-radius: 9999px;
  background: rgba(0,0,0,.25);
  font-size: 0.6875rem;
  font-weight: 800;
}

/* ── Alert ── */
.alert {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.875rem 1.25rem;
  background: var(--c-danger-light);
  border: 1px solid rgba(255,69,58,.35);
  border-radius: 0.75rem;
  color: var(--c-danger);
  font-size: 0.9375rem;
  margin-bottom: 1.5rem;
}
.alert-enter-active { transition: opacity .25s ease, transform .25s ease; }
.alert-leave-active { transition: opacity .2s ease, transform .2s ease; }
.alert-enter-from, .alert-leave-to { opacity: 0; transform: translateY(-6px); }

/* ── Loading ── */
.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 5rem 0;
}
.spinner {
  width: 2.25rem;
  height: 2.25rem;
  border: 2px solid var(--c-border);
  border-top-color: var(--c-brand);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
.loading__text { margin: 0; font-size: 0.875rem; color: var(--c-text-muted); }

/* ── Sections ── */
.db-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 2rem 0;
  border-top: 1px solid var(--c-border);
}

.db-section:first-of-type {
  border-top-color: transparent;
  padding-top: 0;
}

.db-section__header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  flex-wrap: wrap;
}

.db-section__num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 0.375rem;
  background: var(--c-surface-2);
  color: var(--c-text-muted);
  font-size: 0.6875rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.db-section__info { flex: 1; min-width: 0; }

.db-section__title {
  margin: 0 0 0.2rem;
  font-size: 1.0625rem;
  font-weight: 700;
  color: var(--c-text);
}

.db-section__desc {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--c-text-muted);
}

/* ── Live badge ── */
.live-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.25rem 0.7rem;
  background: var(--c-brand-xlight);
  border: 1px solid rgba(48,209,88,.25);
  border-radius: 9999px;
  font-size: 0.6875rem;
  font-weight: 700;
  color: var(--c-brand);
  letter-spacing: 0.03em;
  white-space: nowrap;
  flex-shrink: 0;
}

.live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--c-brand);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.5; transform: scale(0.75); }
}

/* ── Footer ── */
.db-footer {
  padding-top: 1.5rem;
  margin-top: 1rem;
  border-top: 1px solid var(--c-border);
}
.db-footer__text {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--c-text-muted);
  text-align: right;
}

/* ── Utility ── */
.sr-only {
  position: absolute; width: 1px; height: 1px;
  padding: 0; margin: -1px; overflow: hidden;
  clip: rect(0,0,0,0); white-space: nowrap; border: 0;
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .dashboard     { padding: 1.25rem 1rem 2rem; }
  .action-bar    { gap: 0.5rem; }
  .action-btn    { flex: 1; justify-content: center; }
  .db-header     { gap: 1rem; }
}

/* ── Reduced motion ── */
@media (prefers-reduced-motion: reduce) {
  .spinning, .spinner, .live-dot { animation: none; }
  .action-btn, .btn              { transition: none; }
  .alert-enter-active,
  .alert-leave-active            { transition: none; }
}
</style>
