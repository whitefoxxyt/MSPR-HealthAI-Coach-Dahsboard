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
        <template #icon><font-awesome-icon :icon="['fas', 'database']" /></template>
      </MetricsCard>

      <MetricsCard
        title="Valeurs manquantes"
        :value="metrics?.missingValues ?? 0"
        variant="warning"
        :trend="metrics && metrics.missingValues < 300 ? '-5%' : '+3%'"
        :trend-direction="metrics && metrics.missingValues < 300 ? 'down' : 'up'"
      >
        <template #icon><font-awesome-icon :icon="['fas', 'triangle-exclamation']" /></template>
      </MetricsCard>

      <MetricsCard
        title="Doublons détectés"
        :value="metrics?.duplicates ?? 0"
        variant="info"
        trend="-12%"
        trend-direction="down"
      >
        <template #icon><font-awesome-icon :icon="['fas', 'copy']" /></template>
      </MetricsCard>

      <MetricsCard
        title="Anomalies critiques"
        :value="criticalAnomaliesCount"
        variant="danger"
        subtitle="Nécessitent une attention"
      >
        <template #icon><font-awesome-icon :icon="['fas', 'circle-exclamation']" /></template>
      </MetricsCard>

      <MetricsCard
        title="Taux de complétude"
        :value="metrics?.completenessRate ?? 0"
        :is-percentage="true"
        :variant="completenessVariant"
        trend="+2.5%"
        trend-direction="up"
      >
        <template #icon><font-awesome-icon :icon="['fas', 'circle-check']" /></template>
      </MetricsCard>

      <MetricsCard
        title="Score de santé"
        :value="healthScore"
        :is-percentage="true"
        :variant="healthScoreVariant"
        subtitle="Qualité globale des données"
      >
        <template #icon><font-awesome-icon :icon="['fas', 'heart-pulse']" /></template>
      </MetricsCard>

      <MetricsCard
        title="Lignes rejetées (ETL)"
        :value="etlReport?.totals.rowsRejected ?? 0"
        :variant="rejectionVariant"
        :subtitle="`sur ${(etlReport?.totals.rowsRead ?? 0).toLocaleString('fr-FR')} lues`"
      >
        <template #icon><font-awesome-icon :icon="['fas', 'ban']" /></template>
      </MetricsCard>

      <MetricsCard
        title="Taux de rejet (ETL)"
        :value="(etlReport?.totals.rejectionRate ?? 0) * 100"
        :is-percentage="true"
        :variant="rejectionVariant"
        :trend="rejectionTrend"
        :trend-direction="rejectionTrendDir"
      >
        <template #icon><font-awesome-icon :icon="['fas', 'percent']" /></template>
      </MetricsCard>
    </div>

    <div v-if="rejectedPipelines.length > 0" class="rejection-panel">
      <h3 class="rejection-panel__title">
        <font-awesome-icon :icon="['fas', 'chart-bar']" aria-hidden="true" />
        Détail des rejets par pipeline
      </h3>

      <div class="rejection-list">
        <div
          v-for="(pipeline, i) in rejectedPipelines"
          :key="pipeline.name"
          class="rejection-item"
          :style="{ '--delay': `${i * 80}ms` }"
        >
          <div class="rejection-item__head">
            <span class="rejection-item__name">{{ pipeline.name }}</span>
            <div class="rejection-item__meta">
              <span class="rejection-item__count">
                {{ pipeline.rowsRejected.toLocaleString('fr-FR') }} rejetés
              </span>
              <span
                class="rejection-item__rate"
                :class="pipeline.rejectionRate > 0.05 ? 'rate--warn' : 'rate--ok'"
              >
                {{ (pipeline.rejectionRate * 100).toFixed(1) }}%
              </span>
            </div>
          </div>

          <div class="rejection-bar" role="progressbar" :aria-valuenow="pipeline.rejectionRate * 100" aria-valuemin="0" aria-valuemax="100">
            <div
              class="rejection-bar__fill"
              :class="pipeline.rejectionRate > 0.05 ? 'fill--warn' : 'fill--ok'"
              :style="{ width: barWidth(pipeline.rejectionRate) }"
            />
          </div>

          <ul v-if="hasReasons(pipeline)" class="reason-list">
            <li
              v-for="(count, reason) in pipeline.topRejectionReasons"
              :key="reason"
              class="reason-item"
            >
              <span class="reason-dot" aria-hidden="true" />
              <span class="reason-label">{{ reason }}</span>
              <span class="reason-count">{{ count }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DataQualityMetrics, EtlReport, EtlPipelineReport } from '@/types'
import MetricsCard from '@/components/common/MetricsCard.vue'

interface Props {
  metrics: DataQualityMetrics | null
  healthScore: number
  criticalAnomaliesCount: number
  pendingAnomaliesCount: number
  pendingRecordsCount: number
  etlReport: EtlReport | null
}

const props = defineProps<Props>()

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

const rejectionVariant = computed(() => {
  const rate = props.etlReport?.totals.rejectionRate ?? 0
  if (rate === 0) return 'success'
  if (rate > 0.05) return 'danger'
  return 'warning'
})

const rejectionTrend = computed(() => {
  const rate = props.etlReport?.totals.rejectionRate ?? 0
  return rate > 0.05 ? '+' + (rate * 100).toFixed(1) + '%' : '-' + (rate * 100).toFixed(1) + '%'
})

const rejectionTrendDir = computed(() => {
  const rate = props.etlReport?.totals.rejectionRate ?? 0
  return rate > 0.05 ? 'up' : 'down'
})

const rejectedPipelines = computed(() =>
  props.etlReport?.pipelines.filter(p => p.rowsRejected > 0) ?? [],
)

const maxRate = computed(() =>
  Math.max(...rejectedPipelines.value.map(p => p.rejectionRate), 0.001),
)

function barWidth(rate: number) {
  return `${Math.min((rate / maxRate.value) * 100, 100)}%`
}

function hasReasons(pipeline: EtlPipelineReport) {
  return Object.keys(pipeline.topRejectionReasons).length > 0
}
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
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--c-text);
  padding-left: 0.75rem;
  border-left: 3px solid var(--c-info);
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
  50%       { opacity: 0.5; transform: scale(0.8); }
}

@media (prefers-reduced-motion: reduce) {
  .live-dot { animation: none; }
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}

/* ── Rejection panel ── */
.rejection-panel {
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--radius);
  padding: 1.25rem 1.5rem;
  box-shadow: var(--shadow-sm);
}

.rejection-panel__title {
  margin: 0 0 1.25rem;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--c-text);
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.rejection-list {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.rejection-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  animation: fadeSlideUp 0.4s ease both;
  animation-delay: var(--delay, 0ms);
}

@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

@media (prefers-reduced-motion: reduce) {
  .rejection-item { animation: none; }
}

.rejection-item__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.rejection-item__name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--c-text);
}

.rejection-item__meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.rejection-item__count {
  font-size: 0.8125rem;
  color: var(--c-text-muted);
  font-variant-numeric: tabular-nums;
}

.rejection-item__rate {
  font-size: 0.8125rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.rate--warn { color: var(--c-energy); }
.rate--ok   { color: var(--c-brand); }

/* ── Mini bar ── */
.rejection-bar {
  height: 6px;
  background: var(--c-surface-2);
  border-radius: 9999px;
  overflow: hidden;
}

.rejection-bar__fill {
  height: 100%;
  border-radius: 9999px;
  transition: width 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

.fill--warn { background: var(--c-energy); }
.fill--ok   { background: var(--c-brand); }

/* ── Reason list ── */
.reason-list {
  margin: 0.25rem 0 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem 1rem;
}

.reason-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.75rem;
  color: var(--c-text-muted);
}

.reason-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--c-text-muted);
  flex-shrink: 0;
}

.reason-label {
  color: var(--c-text-muted);
}

.reason-count {
  font-weight: 700;
  color: var(--c-text);
  font-variant-numeric: tabular-nums;
}
</style>
