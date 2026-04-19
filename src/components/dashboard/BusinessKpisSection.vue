<template>
  <section class="bk-section" aria-labelledby="bk-title">
    <header class="section-header">
      <div>
        <h2 id="bk-title" class="section-title">KPIs Business</h2>
        <p class="section-subtitle">Indicateurs de performance et actions rapides</p>
      </div>
    </header>

    <div class="kpi-grid">
      <MetricsCard
        title="Engagement"
        :value="analytics.businessKpis.engagementRate"
        :is-percentage="true"
        variant="success"
        trend="+3.2%"
        trend-direction="up"
      >
        <template #icon><font-awesome-icon :icon="['fas', 'fire']" /></template>
      </MetricsCard>

      <MetricsCard
        title="Conversion premium"
        :value="analytics.businessKpis.premiumConversionRate"
        :is-percentage="true"
        variant="info"
        trend="+1.1%"
        trend-direction="up"
      >
        <template #icon><font-awesome-icon :icon="['fas', 'gem']" /></template>
      </MetricsCard>

      <MetricsCard
        title="Satisfaction"
        :value="analytics.businessKpis.satisfactionRate"
        :is-percentage="true"
        variant="success"
        trend="+0.8%"
        trend-direction="up"
      >
        <template #icon><font-awesome-icon :icon="['fas', 'face-smile']" /></template>
      </MetricsCard>
    </div>

    <div class="flows-wrap">
      <DataFlowStatus :flows="flows" />
    </div>

    <nav class="quick-actions" aria-label="Actions rapides">
      <RouterLink to="/data-cleaning" class="action-card">
        <span class="action-card__icon action-card__icon--energy" aria-hidden="true">
          <font-awesome-icon :icon="['fas', 'wand-magic-sparkles']" />
        </span>
        <div class="action-card__body">
          <h3 class="action-card__title">Nettoyage des données</h3>
          <p class="action-card__desc">Corriger les anomalies et normaliser les données</p>
        </div>
        <span v-if="pendingAnomaliesCount > 0" class="action-card__badge">{{ pendingAnomaliesCount }} anomalie{{ pendingAnomaliesCount > 1 ? 's' : '' }}</span>
      </RouterLink>

      <RouterLink to="/validation" class="action-card">
        <span class="action-card__icon action-card__icon--brand" aria-hidden="true">
          <font-awesome-icon :icon="['fas', 'shield-check']" />
        </span>
        <div class="action-card__body">
          <h3 class="action-card__title">Workflow de validation</h3>
          <p class="action-card__desc">Approuver ou rejeter les données en attente</p>
        </div>
        <span v-if="pendingRecordsCount > 0" class="action-card__badge">{{ pendingRecordsCount }} en attente</span>
      </RouterLink>

      <button class="action-card action-card--btn" @click="$emit('export')">
        <span class="action-card__icon action-card__icon--info" aria-hidden="true">
          <font-awesome-icon :icon="['fas', 'file-export']" />
        </span>
        <div class="action-card__body">
          <h3 class="action-card__title">Exporter les données</h3>
          <p class="action-card__desc">Télécharger les données nettoyées (JSON / CSV)</p>
        </div>
      </button>

      <button class="action-card action-card--btn" @click="$emit('refresh')">
        <span class="action-card__icon action-card__icon--muted" aria-hidden="true">
          <font-awesome-icon :icon="['fas', 'arrows-rotate']" />
        </span>
        <div class="action-card__body">
          <h3 class="action-card__title">Actualiser</h3>
          <p class="action-card__desc">Rafraîchir toutes les métriques</p>
        </div>
      </button>
    </nav>
  </section>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import type { AnalyticsOverview, DataFlowStats } from '@/types'
import MetricsCard from '@/components/common/MetricsCard.vue'
import DataFlowStatus from '@/components/dashboard/DataFlowStatus.vue'

defineProps<{
  analytics: AnalyticsOverview
  flows: DataFlowStats[]
  pendingAnomaliesCount: number
  pendingRecordsCount: number
}>()

defineEmits<{
  export: []
  refresh: []
}>()
</script>

<style scoped>
.bk-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
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
  border-left: 3px solid var(--c-brand);
}

.section-subtitle {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--c-text-muted);
  padding-left: 0.75rem;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}

.flows-wrap {
  /* DataFlowStatus handles its own card styling */
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
}

.action-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--radius);
  padding: 1.25rem;
  box-shadow: var(--shadow-sm);
  text-decoration: none;
  color: var(--c-text);
  transition: border-color 0.15s, box-shadow 0.15s, transform 0.1s;
  cursor: pointer;
  width: 100%;
  text-align: left;
  font: inherit;
}

.action-card:hover {
  border-color: var(--c-brand);
  box-shadow: 0 4px 12px rgba(22, 163, 74, 0.15);
  transform: translateY(-1px);
}

.action-card:focus-visible {
  outline: 2px solid var(--c-brand);
  outline-offset: 2px;
}

.action-card--btn {
  background: var(--c-surface);
}

.action-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background: var(--c-surface-2);
  color: var(--c-text-muted);
  font-size: 0.9375rem;
  flex-shrink: 0;
}

.action-card__icon--brand {
  background: var(--c-brand);
  color: #000000;
}

.action-card__icon--energy {
  background: var(--c-energy);
  color: #000000;
}

.action-card__icon--info {
  background: var(--c-info);
  color: #ffffff;
}

.action-card__icon--muted {
  background: var(--c-surface-2);
  color: var(--c-text-muted);
}

.action-card__body {
  flex: 1;
  min-width: 0;
}

.action-card__title {
  margin: 0 0 0.25rem;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--c-text);
}

.action-card__desc {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--c-text-muted);
  line-height: 1.4;
}

.action-card__badge {
  flex-shrink: 0;
  padding: 0.2rem 0.65rem;
  background: var(--c-brand-xlight);
  color: var(--c-brand-dark);
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 700;
  white-space: nowrap;
}
</style>
