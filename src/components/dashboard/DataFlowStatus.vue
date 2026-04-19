<template>
  <div class="data-flow-status">
    <h3 class="data-flow-status__title">Statut des flux de données</h3>
    <div class="data-flow-status__grid">
      <div
        v-for="flow in flows"
        :key="flow.name"
        class="flow-card"
        :class="getFlowClass(flow.status)"
      >
        <div class="flow-card__header">
          <h4 class="flow-card__name">{{ flow.name }}</h4>
          <span class="flow-card__badge" :class="getFlowClass(flow.status)">
            {{ translateStatus(flow.status) }}
          </span>
        </div>
        <div class="flow-card__metrics">
          <div class="metric">
            <span class="metric__label">Enregistrements aujourd'hui</span>
            <span class="metric__value">{{ formatNumber(flow.recordsToday) }}</span>
          </div>
          <div class="metric">
            <span class="metric__label">Dernière synchronisation</span>
            <span class="metric__value">{{ timeAgo(flow.lastSync) }}</span>
          </div>
          <div class="metric">
            <span class="metric__label">Taux d'erreur</span>
            <span class="metric__value" :class="getErrorClass(flow.errorRate)">
              {{ formatPercentage(flow.errorRate) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DataFlowStats } from '@/types'
import { formatNumber, formatPercentage, timeAgo } from '@/utils/helpers'

interface Props {
  flows: DataFlowStats[]
}

defineProps<Props>()

function translateStatus(status: string): string {
  const translations: Record<string, string> = {
    active: 'Actif',
    inactive: 'Inactif',
    error: 'Erreur',
  }
  return translations[status] || status
}

function getFlowClass(status: string): string {
  return `status-${status}`
}

function getErrorClass(errorRate: number): string {
  if (errorRate < 1) return 'error-low'
  if (errorRate < 5) return 'error-medium'
  return 'error-high'
}
</script>

<style scoped>
.data-flow-status {
  background: var(--c-surface);
  border-radius: var(--radius);
  border: 1px solid var(--c-border);
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
}

.data-flow-status__title {
  margin: 0 0 1.25rem;
  font-size: 1rem;
  font-weight: 700;
  color: var(--c-text);
}

.data-flow-status__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1rem;
}

.flow-card {
  padding: 1.25rem;
  border-radius: calc(var(--radius) * 0.75);
  border: 1px solid var(--c-border);
  border-left: 4px solid var(--c-border);
  background: var(--c-surface);
  transition: transform 0.15s, box-shadow 0.15s;
}

.flow-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.flow-card.status-active {
  border-left-color: var(--c-brand);
  background: var(--c-surface-2);
}

.flow-card.status-inactive {
  border-left-color: var(--c-text-muted);
  background: var(--c-surface);
}

.flow-card.status-error {
  border-left-color: var(--c-danger);
  background: var(--c-surface-2);
}

.flow-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  gap: 0.5rem;
}

.flow-card__name {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--c-text);
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.flow-card__badge {
  padding: 0.2rem 0.65rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  flex-shrink: 0;
}

.flow-card__badge.status-active {
  background: var(--c-brand);
  color: #fff;
}

.flow-card__badge.status-inactive {
  background: #94a3b8;
  color: #fff;
}

.flow-card__badge.status-error {
  background: var(--c-danger);
  color: #fff;
}

.flow-card__metrics {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.metric {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.metric__label {
  font-size: 0.8125rem;
  color: var(--c-text-muted);
}

.metric__value {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--c-text);
  font-variant-numeric: tabular-nums;
}

.metric__value.error-low  { color: var(--c-brand); }
.metric__value.error-medium { color: var(--c-energy); }
.metric__value.error-high { color: var(--c-danger); }

@media (prefers-reduced-motion: reduce) {
  .flow-card {
    transition: none;
  }

  .flow-card:hover {
    transform: none;
  }
}

@media (max-width: 768px) {
  .data-flow-status__grid {
    grid-template-columns: 1fr;
  }
}
</style>
