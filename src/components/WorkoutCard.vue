<script setup lang="ts">
import { computed } from 'vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import type { ExerciseInProgram } from '@/services/recoFitnessApi'

const props = defineProps<{
  exercise: ExerciseInProgram
  position: number
}>()

const positionLabel = computed(() => String(props.position).padStart(2, '0'))

const equipmentLabel = computed(() =>
  props.exercise.equipment.length > 0
    ? props.exercise.equipment.join(' · ')
    : 'Sans matériel',
)

const difficultyVariant = computed<'mint' | 'sky' | 'coral'>(() => {
  const d = props.exercise.difficulty.toLowerCase()
  if (d.includes('begin') || d.includes('easy') || d.includes('debut')) return 'mint'
  if (d.includes('adv') || d.includes('hard') || d.includes('expert')) return 'coral'
  return 'sky'
})
</script>

<template>
  <article class="workout-card" data-testid="workout-card">
    <figure v-if="props.exercise.gif_url" class="workout-card__media">
      <img
        :src="props.exercise.gif_url"
        :alt="`Démonstration : ${props.exercise.name}`"
        class="workout-card__gif"
        loading="lazy"
        decoding="async"
      />
    </figure>
    <div class="workout-card__body">
      <header class="workout-card__head">
        <span class="workout-card__position" aria-hidden="true">{{ positionLabel }}</span>
        <div class="workout-card__title-group">
          <h4 class="workout-card__name">{{ props.exercise.name }}</h4>
          <p v-if="props.exercise.category" class="workout-card__category">
            {{ props.exercise.category }}
          </p>
        </div>
        <AppBadge :variant="difficultyVariant" size="sm">{{ props.exercise.difficulty }}</AppBadge>
      </header>

      <dl class="workout-card__meta">
        <div class="workout-card__row">
          <dt class="workout-card__row-label">Muscles ciblés</dt>
          <dd class="workout-card__row-value workout-card__row-value--chips">
            <span
              v-for="muscle in props.exercise.target_muscles"
              :key="muscle"
              class="workout-card__chip"
            >{{ muscle }}</span>
          </dd>
        </div>
        <div class="workout-card__row">
          <dt class="workout-card__row-label">Équipement</dt>
          <dd class="workout-card__row-value">{{ equipmentLabel }}</dd>
        </div>
      </dl>
    </div>
  </article>
</template>

<style scoped>
.workout-card {
  display: flex;
  gap: var(--sp-md);
  padding: var(--sp-md) var(--sp-lg);
  background: var(--c-onyx);
  color: var(--c-cream);
  border-radius: var(--r-lg);
  border: 1px solid rgba(245, 240, 235, 0.08);
  font-family: var(--font-body);
  transition: transform var(--d-standard) var(--ease-out-expo);
}

.workout-card:hover {
  transform: translateY(-1px);
  border-color: rgba(200, 255, 71, 0.35);
}

.workout-card__media {
  margin: 0;
  flex-shrink: 0;
  width: 112px;
  height: 112px;
  border-radius: var(--r-md);
  overflow: hidden;
  background: rgba(245, 240, 235, 0.06);
  align-self: center;
}

.workout-card__gif {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.workout-card__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--sp-md);
}

.workout-card__head {
  display: flex;
  align-items: center;
  gap: var(--sp-md);
}

.workout-card__position {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: var(--r-pill);
  background: var(--c-acid);
  color: var(--c-onyx);
  font-family: var(--font-mono);
  font-weight: 600;
  font-size: 0.875rem;
  flex-shrink: 0;
}

.workout-card__title-group {
  flex: 1;
  min-width: 0;
}

.workout-card__name {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.125rem;
  font-weight: 500;
  letter-spacing: -0.01em;
  line-height: 1.2;
}

.workout-card__category {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 0.625rem;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: var(--c-acid);
  margin-top: 0.2rem;
}

.workout-card__meta {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--sp-sm);
}

.workout-card__row {
  display: grid;
  grid-template-columns: minmax(110px, 140px) 1fr;
  gap: var(--sp-md);
  align-items: center;
}

.workout-card__row-label {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 0.625rem;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: var(--c-gray-400);
}

.workout-card__row-value {
  margin: 0;
  font-size: 0.875rem;
  color: var(--c-cream);
  word-break: break-word;
}

.workout-card__row-value--chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.workout-card__chip {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.65rem;
  border-radius: var(--r-pill);
  background: rgba(245, 240, 235, 0.08);
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  letter-spacing: 0.05em;
  color: var(--c-cream);
}

@media (max-width: 640px) {
  .workout-card {
    flex-direction: column;
    align-items: stretch;
  }
  .workout-card__media {
    width: 100%;
    height: 180px;
    align-self: stretch;
  }
  .workout-card__row {
    grid-template-columns: 1fr;
    gap: 0.25rem;
  }
}
</style>
