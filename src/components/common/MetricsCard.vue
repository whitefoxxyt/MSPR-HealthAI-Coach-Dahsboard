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
  padding: 1.25rem 1.5rem;
  background: var(--c-surface);
  border-radius: var(--radius);
  border: 1px solid var(--c-border);
  box-shadow: var(--shadow-sm);
  transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;
}

.metrics-card:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
  border-color: rgba(255, 255, 255, 0.12);
}

.metrics-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 0.75rem;
  background: var(--c-surface-2);
  font-size: 1.25rem;
  flex-shrink: 0;
}

.metrics-card__content {
  flex: 1;
  min-width: 0;
}

.metrics-card__title {
  margin: 0 0 0.25rem;
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--c-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.07em;
}

.metrics-card__value {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--c-text);
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}

.metrics-card__subtitle {
  margin: 0.25rem 0 0;
  font-size: 0.8125rem;
  color: var(--c-text-muted);
}

.metrics-card__trend {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.2rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  flex-shrink: 0;
}

.trend-up {
  color: var(--c-brand);
  background: var(--c-brand-xlight);
}

.trend-down {
  color: var(--c-danger);
  background: var(--c-danger-light);
}

.trend-neutral {
  color: var(--c-text-muted);
  background: var(--c-surface-2);
}

/* Variants — icon background */
.metrics-card.success .metrics-card__icon {
  background: var(--c-brand-xlight);
  color: var(--c-brand);
}

.metrics-card.warning .metrics-card__icon {
  background: var(--c-energy-light);
  color: var(--c-energy);
}

.metrics-card.danger .metrics-card__icon {
  background: var(--c-danger-light);
  color: var(--c-danger);
}

.metrics-card.info .metrics-card__icon {
  background: var(--c-info-light);
  color: var(--c-info);
}

@media (prefers-reduced-motion: reduce) {
  .metrics-card {
    transition: none;
  }

  .metrics-card:hover {
    transform: none;
  }
}
</style>
