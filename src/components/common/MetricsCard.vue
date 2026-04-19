<template>
  <div class="metrics-card" :class="variant">
    <div class="metrics-card__icon" aria-hidden="true">
      <slot name="icon" />
    </div>
    <div class="metrics-card__content">
      <h3 class="metrics-card__title">{{ title }}</h3>
      <p class="metrics-card__value">{{ formattedValue }}</p>
      <p v-if="subtitle" class="metrics-card__subtitle">{{ subtitle }}</p>
    </div>
    <div v-if="trend" class="metrics-card__trend" :class="trendClass">
      <font-awesome-icon :icon="trendIcon" :aria-label="trendAriaLabel" />
      <span>{{ trend }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
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

const animatedValue = ref(0)
let rafId: number | null = null

watch(
  () => props.value,
  (newVal) => {
    if (typeof newVal !== 'number') return
    const start = animatedValue.value
    const end = newVal
    const duration = 750
    const startTime = performance.now()

    if (rafId !== null) cancelAnimationFrame(rafId)

    function tick(now: number) {
      const elapsed = now - startTime
      const p = Math.min(elapsed / duration, 1)
      const eased = 1 - (1 - p) ** 3
      animatedValue.value = start + (end - start) * eased
      if (p < 1) rafId = requestAnimationFrame(tick)
      else animatedValue.value = end
    }

    rafId = requestAnimationFrame(tick)
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  if (rafId !== null) cancelAnimationFrame(rafId)
})

const formattedValue = computed(() => {
  if (typeof props.value === 'string') return props.value
  const v = animatedValue.value
  return props.isPercentage ? formatPercentage(v) : formatNumber(Math.round(v))
})

const trendClass = computed(() => `trend-${props.trendDirection || 'neutral'}`)

const trendIcon = computed(() => {
  if (props.trendDirection === 'up') return ['fas', 'arrow-trend-up']
  if (props.trendDirection === 'down') return ['fas', 'arrow-trend-down']
  return ['fas', 'minus']
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
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.metrics-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: rgba(255, 255, 255, 0.14);
}

.metrics-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 50%;
  background: var(--c-surface-2);
  color: var(--c-text-muted);
  font-size: 1rem;
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.metrics-card:hover .metrics-card__icon {
  transform: scale(1.1);
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

.trend-up   { color: var(--c-brand);       background: var(--c-brand-xlight); }
.trend-down { color: var(--c-danger);      background: var(--c-danger-light);  }
.trend-neutral { color: var(--c-text-muted); background: var(--c-surface-2);  }

/* Variants */
.metrics-card.success .metrics-card__icon { background: var(--c-brand);  color: #000; }
.metrics-card.warning .metrics-card__icon { background: var(--c-energy); color: #000; }
.metrics-card.danger  .metrics-card__icon { background: var(--c-danger); color: #fff; }
.metrics-card.info    .metrics-card__icon { background: var(--c-info);   color: #fff; }

@media (prefers-reduced-motion: reduce) {
  .metrics-card,
  .metrics-card__icon { transition: none; }
  .metrics-card:hover { transform: none; }
  .metrics-card:hover .metrics-card__icon { transform: none; }
}
</style>
