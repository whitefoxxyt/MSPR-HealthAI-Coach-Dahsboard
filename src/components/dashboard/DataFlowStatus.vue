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
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  padding: 1.5rem;
}

.data-flow-status__title {
  margin: 0 0 1.5rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
}

.data-flow-status__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.flow-card {
  padding: 1.25rem;
  border-radius: 6px;
  border: 2px solid #e5e7eb;
  transition: all 0.2s;
}

.flow-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.flow-card.status-active {
  border-color: #10b981;
  background: #f0fdf4;
}

.flow-card.status-inactive {
  border-color: #9ca3af;
  background: #f9fafb;
}

.flow-card.status-error {
  border-color: #ef4444;
  background: #fef2f2;
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
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  flex: 1;
  min-width: 0;
}

.flow-card__badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  flex-shrink: 0;
}

.flow-card__badge.status-active {
  background: #10b981;
  color: white;
}

.flow-card__badge.status-inactive {
  background: #9ca3af;
  color: white;
}

.flow-card__badge.status-error {
  background: #ef4444;
  color: white;
}

.flow-card__metrics {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.metric {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.metric__label {
  font-size: 0.875rem;
  color: #6b7280;
}

.metric__value {
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
}

.metric__value.error-low {
  color: #059669;
}

.metric__value.error-medium {
  color: #d97706;
}

.metric__value.error-high {
  color: #dc2626;
}

/* Accessibilité */
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
