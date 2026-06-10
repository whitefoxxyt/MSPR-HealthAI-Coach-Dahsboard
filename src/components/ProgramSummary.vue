<script setup lang="ts">
import { computed } from 'vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import type { WorkoutProgram } from '@/services/recoFitnessApi'

const props = defineProps<{
  program: WorkoutProgram
  tag: string
}>()

const totalExercises = computed(() =>
  props.program.weeks.reduce(
    (sum, week) => sum + week.reduce((s, session) => s + session.length, 0),
    0,
  ),
)

const totalSessions = computed(() =>
  props.program.weeks.reduce((sum, week) => sum + week.length, 0),
)

// Les programmes générés avant l'ajout du nom n'en ont pas : repli court
// sur l'identifiant tronqué plutôt qu'un UUID complet en titre.
const title = computed(() => {
  if (props.program.name) return props.program.name
  return `Programme ${props.program.program_id.slice(0, 8)}`
})
</script>

<template>
  <section class="program-summary" data-testid="program-summary">
    <header class="program-summary__head">
      <p class="program-summary__eyebrow">Programme</p>
      <h2 class="program-summary__title">{{ title }}</h2>
      <AppBadge variant="acid" size="md">{{ props.tag }}</AppBadge>
    </header>

    <div class="program-summary__stats">
      <div class="program-summary__stat">
        <p class="program-summary__stat-label">Durée</p>
        <p class="program-summary__stat-value">
          {{ props.program.duration_weeks }}<span class="program-summary__stat-unit">semaines</span>
        </p>
      </div>
      <div class="program-summary__stat" data-testid="program-total-sessions">
        <p class="program-summary__stat-label">Séances</p>
        <p class="program-summary__stat-value">{{ totalSessions }}</p>
      </div>
      <div class="program-summary__stat" data-testid="program-total-exercises">
        <p class="program-summary__stat-label">Exercices</p>
        <p class="program-summary__stat-value">{{ totalExercises }}</p>
      </div>
    </div>

    <footer class="program-summary__footer">
      <span class="program-summary__footer-label">Scoring</span>
      <span
        class="program-summary__footer-value"
        data-testid="program-scoring-strategy"
      >{{ props.program.scoring_strategy }}</span>
      <span class="program-summary__footer-sep" aria-hidden="true">·</span>
      <span class="program-summary__footer-label">Tier</span>
      <span class="program-summary__footer-value">{{ props.program.tier_at_generation }}</span>
    </footer>
  </section>
</template>

<style scoped>
.program-summary {
  background: var(--c-onyx);
  color: var(--c-cream);
  border-radius: var(--r-lg);
  padding: var(--sp-xl) var(--sp-lg);
  display: flex;
  flex-direction: column;
  gap: var(--sp-lg);
  font-family: var(--font-body);
  border: 1px solid rgba(245, 240, 235, 0.08);
}

.program-summary__head {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--sp-md);
}

.program-summary__eyebrow {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 0.625rem;
  text-transform: uppercase;
  letter-spacing: 0.22em;
  color: var(--c-gray-400);
  width: 100%;
}

.program-summary__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 500;
  letter-spacing: -0.01em;
  flex: 1;
  min-width: 0;
  word-break: break-word;
}

.program-summary__stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: var(--sp-md);
  padding-top: var(--sp-md);
  border-top: 1px solid rgba(245, 240, 235, 0.08);
}

.program-summary__stat {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.program-summary__stat-label {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 0.625rem;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: var(--c-gray-400);
}

.program-summary__stat-value {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.75rem;
  font-weight: 500;
  letter-spacing: -0.015em;
  color: var(--c-acid);
  line-height: 1.1;
}

.program-summary__stat-unit {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  margin-left: 0.4rem;
  color: var(--c-gray-400);
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.program-summary__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.45rem;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--c-gray-400);
  padding-top: var(--sp-sm);
  border-top: 1px solid rgba(245, 240, 235, 0.08);
}

.program-summary__footer-label {
  text-transform: uppercase;
  letter-spacing: 0.18em;
  font-size: 0.625rem;
}

.program-summary__footer-value {
  color: var(--c-cream);
  letter-spacing: 0.04em;
}

.program-summary__footer-sep {
  color: var(--c-gray-600);
}
</style>
