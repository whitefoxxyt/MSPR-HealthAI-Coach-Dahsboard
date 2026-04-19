<template>
  <div class="dq">
    <!-- KPI grid -->
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
        subtitle="Nécessitent une intervention"
      >
        <template #icon><font-awesome-icon :icon="['fas', 'circle-exclamation']" /></template>
      </MetricsCard>

      <MetricsCard
        title="Complétude"
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
        subtitle="Qualité globale"
      >
        <template #icon><font-awesome-icon :icon="['fas', 'heart-pulse']" /></template>
      </MetricsCard>

      <MetricsCard
        title="Lignes rejetées (ETL)"
        :value="etlReport?.totals.rowsRejected ?? 0"
        :variant="rejectionCountVariant"
        :subtitle="`sur ${(etlReport?.totals.rowsRead ?? 0).toLocaleString('fr-FR')} lues`"
      >
        <template #icon><font-awesome-icon :icon="['fas', 'ban']" /></template>
      </MetricsCard>

      <MetricsCard
        title="Taux de rejet (ETL)"
        :value="(etlReport?.totals.rejectionRate ?? 0) * 100"
        :is-percentage="true"
        :variant="rejectionRateVariant"
        :trend-direction="(etlReport?.totals.rejectionRate ?? 0) > 0.05 ? 'up' : 'down'"
      >
        <template #icon><font-awesome-icon :icon="['fas', 'percent']" /></template>
      </MetricsCard>
    </div>

    <!-- Flux de données -->
    <div class="subsection">
      <h3 class="subsection__title">Flux de données</h3>
      <div class="flows-grid">
        <div
          v-for="flow in flows"
          :key="flow.name"
          class="flow-row"
          :class="`flow-row--${flow.status}`"
        >
          <span class="flow-row__dot" :aria-label="`Statut : ${translateStatus(flow.status)}`"></span>
          <span class="flow-row__name">{{ flow.name }}</span>
          <span class="flow-row__badge" :class="`badge--${flow.status}`">{{ translateStatus(flow.status) }}</span>
          <dl class="flow-row__metrics">
            <div class="flow-metric">
              <dt>Enregistrements</dt>
              <dd>{{ flow.recordsToday.toLocaleString('fr-FR') }}</dd>
            </div>
            <div class="flow-metric">
              <dt>Dernière synchro</dt>
              <dd>{{ timeAgo(flow.lastSync) }}</dd>
            </div>
            <div class="flow-metric">
              <dt>Taux d'erreur</dt>
              <dd :class="getErrorClass(flow.errorRate)">{{ flow.errorRate.toFixed(1) }} %</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>

    <!-- Rejets ETL par pipeline -->
    <div v-if="rejectedPipelines.length > 0" class="subsection">
      <h3 class="subsection__title">Détail des rejets par pipeline</h3>
      <table class="reject-table" aria-label="Détail des rejets ETL par pipeline">
        <thead>
          <tr>
            <th scope="col">Pipeline</th>
            <th scope="col" class="num-col">Lus</th>
            <th scope="col" class="num-col">Insérés</th>
            <th scope="col" class="num-col">Rejetés</th>
            <th scope="col" class="num-col">Taux</th>
            <th scope="col">Raisons principales</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in rejectedPipelines" :key="p.name">
            <td class="pipeline-name">{{ p.name }}</td>
            <td class="num-col">{{ p.rowsRead.toLocaleString('fr-FR') }}</td>
            <td class="num-col">{{ p.rowsInserted.toLocaleString('fr-FR') }}</td>
            <td class="num-col rejected-count">{{ p.rowsRejected.toLocaleString('fr-FR') }}</td>
            <td class="num-col" :class="p.rejectionRate > 0.05 ? 'rate-warn' : 'rate-ok'">
              {{ (p.rejectionRate * 100).toFixed(1) }} %
            </td>
            <td class="reasons-col">
              <span
                v-for="(count, reason) in p.topRejectionReasons"
                :key="reason"
                class="reason-tag"
              >
                {{ reason }}&nbsp;<strong>{{ count }}</strong>
              </span>
              <span v-if="!hasReasons(p)" class="no-reasons">—</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DataQualityMetrics, DataFlowStats, EtlReport, EtlPipelineReport } from '@/types'
import { timeAgo } from '@/utils/helpers'
import MetricsCard from '@/components/common/MetricsCard.vue'

interface Props {
  metrics: DataQualityMetrics | null
  healthScore: number
  criticalAnomaliesCount: number
  pendingAnomaliesCount: number
  pendingRecordsCount: number
  etlReport: EtlReport | null
  flows: DataFlowStats[]
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

const rejectionCountVariant = computed(() => {
  const n = props.etlReport?.totals.rowsRejected ?? 0
  if (n === 0) return 'success'
  if (n > 500) return 'danger'
  return 'warning'
})

const rejectionRateVariant = computed(() => {
  const r = props.etlReport?.totals.rejectionRate ?? 0
  if (r === 0) return 'success'
  if (r > 0.05) return 'danger'
  return 'warning'
})

const rejectedPipelines = computed(() =>
  props.etlReport?.pipelines.filter(p => p.rowsRejected > 0) ?? [],
)

function hasReasons(p: EtlPipelineReport) {
  return Object.keys(p.topRejectionReasons).length > 0
}

function translateStatus(status: string) {
  return ({ active: 'Actif', inactive: 'Inactif', error: 'Erreur' })[status] ?? status
}

function getErrorClass(rate: number) {
  if (rate < 1) return 'err-low'
  if (rate < 5) return 'err-med'
  return 'err-high'
}
</script>

<style scoped>
.dq {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* ── KPI grid ── */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.875rem;
}

/* ── Subsections ── */
.subsection { display: flex; flex-direction: column; gap: 0.875rem; }

.subsection__title {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--c-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

/* ── Flux de données ── */
.flows-grid {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.flow-row {
  display: grid;
  grid-template-columns: auto auto 1fr auto;
  align-items: center;
  gap: 0.75rem 1rem;
  padding: 0.75rem 1rem;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: 0.625rem;
  flex-wrap: wrap;
}

.flow-row__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.flow-row--active   .flow-row__dot { background: var(--c-brand); }
.flow-row--inactive .flow-row__dot { background: var(--c-text-muted); }
.flow-row--error    .flow-row__dot { background: var(--c-danger); animation: pulse 1.5s ease-in-out infinite; }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.4; }
}
@media (prefers-reduced-motion: reduce) {
  .flow-row__dot { animation: none; }
}

.flow-row__name {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--c-text);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.flow-row__badge {
  padding: 0.15rem 0.6rem;
  border-radius: 9999px;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  white-space: nowrap;
}
.badge--active   { background: var(--c-brand-xlight); color: var(--c-brand); }
.badge--inactive { background: var(--c-surface-2);    color: var(--c-text-muted); }
.badge--error    { background: var(--c-danger-light);  color: var(--c-danger); }

.flow-row__metrics {
  grid-column: 1 / -1;
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
  margin: 0;
}

.flow-metric {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}
.flow-metric dt {
  font-size: 0.6875rem;
  color: var(--c-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.flow-metric dd {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--c-text);
  font-variant-numeric: tabular-nums;
}
.err-low  { color: var(--c-brand); }
.err-med  { color: var(--c-energy); }
.err-high { color: var(--c-danger); }

/* ── Rejection table ── */
.reject-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.reject-table th {
  padding: 0.625rem 0.875rem;
  text-align: left;
  font-size: 0.6875rem;
  font-weight: 700;
  color: var(--c-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  border-bottom: 1px solid var(--c-border);
  white-space: nowrap;
}

.reject-table td {
  padding: 0.75rem 0.875rem;
  border-bottom: 1px solid var(--c-border);
  color: var(--c-text);
  vertical-align: top;
}

.reject-table tbody tr:last-child td { border-bottom: none; }

.reject-table tbody tr:hover td {
  background: var(--c-surface);
}

.num-col        { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
.pipeline-name  { font-weight: 600; }
.rejected-count { color: var(--c-danger); font-weight: 700; }
.rate-warn      { color: var(--c-energy); font-weight: 700; }
.rate-ok        { color: var(--c-brand); font-weight: 700; }

.reasons-col { max-width: 320px; }

.reason-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.15rem 0.5rem;
  margin: 0.1rem 0.2rem 0.1rem 0;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: 0.375rem;
  font-size: 0.75rem;
  color: var(--c-text-muted);
  white-space: nowrap;
}
.reason-tag strong { color: var(--c-text); }

.no-reasons { color: var(--c-text-muted); }

@media (max-width: 768px) {
  .reject-table { font-size: 0.8125rem; }
  .flow-row { grid-template-columns: auto auto 1fr; }
}
</style>
