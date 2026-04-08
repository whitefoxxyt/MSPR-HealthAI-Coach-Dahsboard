<template>
  <div class="metrics-card" :class="variant">
    <div class="metrics-card__icon" :aria-hidden="true">
      <slot name="icon">
        <span class="default-icon">📊</span>
      </slot>
    </div>
    <div class="metrics-card__content">
      <h3 class="metrics-card__title">{{ title }}</h3>
      <p class="metrics-card__value">{{ formattedValue }}</p>
      <p v-if="subtitle" class="metrics-card__subtitle">{{ subtitle }}</p>
    </div>
    <div v-if="trend" class="metrics-card__trend" :class="trendClass">
      <span :aria-label="trendAriaLabel">{{ trendIcon }}</span>
      <span>{{ trend }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatNumber, formatPercentage } from '@/utils/helpers'

interface Props {
  title: string
  value: number | string
  subtitle?: string
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  trend?: string
  trendDirection?: 'up' | 'down' | 'neutral'
  isPercentage?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  isPercentage: false,
})

const formattedValue = computed(() => {
  if (typeof props.value === 'string') return props.value
  return props.isPercentage 
    ? formatPercentage(props.value) 
    : formatNumber(props.value)
})

const trendClass = computed(() => {
  return `trend-${props.trendDirection || 'neutral'}`
})

const trendIcon = computed(() => {
  if (props.trendDirection === 'up') return '↑'
  if (props.trendDirection === 'down') return '↓'
  return '→'
})

const trendAriaLabel = computed(() => {
  if (props.trendDirection === 'up') return 'Tendance à la hausse'
  if (props.trendDirection === 'down') return 'Tendance à la baisse'
  return 'Tendance stable'
})
</script>

<style scoped>
.metrics-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.metrics-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.metrics-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border-radius: 8px;
  background: #f3f4f6;
  font-size: 1.5rem;
}

.metrics-card__content {
  flex: 1;
  min-width: 0;
}

.metrics-card__title {
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.metrics-card__value {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  color: #111827;
  line-height: 1;
}

.metrics-card__subtitle {
  margin: 0.5rem 0 0 0;
  font-size: 0.875rem;
  color: #6b7280;
}

.metrics-card__trend {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 600;
}

.trend-up {
  color: #059669;
  background: #d1fae5;
}

.trend-down {
  color: #dc2626;
  background: #fee2e2;
}

.trend-neutral {
  color: #6b7280;
  background: #f3f4f6;
}

/* Variants */
.metrics-card.success .metrics-card__icon {
  background: #d1fae5;
  color: #059669;
}

.metrics-card.warning .metrics-card__icon {
  background: #fef3c7;
  color: #d97706;
}

.metrics-card.danger .metrics-card__icon {
  background: #fee2e2;
  color: #dc2626;
}

.metrics-card.info .metrics-card__icon {
  background: #dbeafe;
  color: #2563eb;
}

/* Accessibilité */
@media (prefers-reduced-motion: reduce) {
  .metrics-card {
    transition: none;
  }
  
  .metrics-card:hover {
    transform: none;
  }
}
</style>
