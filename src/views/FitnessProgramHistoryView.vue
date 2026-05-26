<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import UserLayout from '@/layouts/UserLayout.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppButton from '@/components/ui/AppButton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import RateLimitBanner from '@/components/ui/RateLimitBanner.vue'
import { useFitnessProgramStore } from '@/stores/fitnessProgram'
import { fitnessGoalTag } from '@/utils/fitnessGoals'
import type { WorkoutProgram } from '@/services/recoFitnessApi'

const PAGE_SIZE = 10
const RATE_LIMIT_FALLBACK_SECONDS = 60

const programStore = useFitnessProgramStore()
const rateLimit = ref<number | null>(null)

function tierLabel(tier: WorkoutProgram['tier_at_generation']): string {
  switch (tier) {
    case 'premium_plus':
      return 'premium+'
    default:
      return tier
  }
}

function totalSessions(program: WorkoutProgram): number {
  return program.weeks.reduce((sum, week) => sum + week.length, 0)
}

function totalDurationLabel(program: WorkoutProgram): string {
  const perSession = program.duration_min_per_session
  if (!perSession) return '-'
  const minutes = totalSessions(program) * perSession
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (m === 0) return `${h}h`
  return `${h}h${String(m).padStart(2, '0')}`
}

const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
})

function formatCreatedAt(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return dateFormatter.format(date)
}

const hasMore = computed(
  () => programStore.history.length < programStore.historyTotal,
)
const isInitialLoading = computed(
  () =>
    programStore.historyLoading
    && programStore.history.length === 0
    && programStore.historyError === null,
)
const isEmpty = computed(
  () =>
    !programStore.historyLoading
    && programStore.history.length === 0
    && programStore.historyTotal === 0
    && programStore.historyError === null,
)

const errorMessage = computed<string>(() => {
  const status = programStore.historyError?.status
  if (status === undefined) return ''
  if (status >= 500) return 'Service de recommandation indisponible. Réessaie dans un instant.'
  if (status === 401) return 'Session expirée. Reconnecte-toi.'
  return 'Une erreur est survenue.'
})

watch(
  () => programStore.historyError,
  (err) => {
    if (err?.status === 429) {
      rateLimit.value = err.retryAfter ?? RATE_LIMIT_FALLBACK_SECONDS
    }
  },
)

async function loadMore() {
  await programStore.loadHistory(PAGE_SIZE, programStore.history.length)
}

onMounted(() => {
  void programStore.loadHistory(PAGE_SIZE, 0)
})
</script>

<template>
  <UserLayout eyebrow="Performance" title="Historique programmes">
    <div class="history">
      <RateLimitBanner
        v-if="rateLimit"
        data-testid="history-rate-limit"
        :retry-after="rateLimit"
        message="Limite atteinte. Réessaie dans"
        @dismiss="rateLimit = null"
      />
      <p
        v-else-if="programStore.historyError"
        role="alert"
        data-testid="history-error"
        class="error-banner"
      >
        <strong>Erreur</strong>
        {{ errorMessage }}
      </p>

      <div v-if="isInitialLoading" data-testid="history-skeleton" class="skeleton">
        <LoadingSpinner size="lg" accent="acid" label="Chargement de l'historique" />
        <p class="skeleton__text">Chargement de l'historique…</p>
      </div>

      <EmptyState
        v-else-if="isEmpty"
        data-testid="history-empty"
        icon="✦"
        title="Aucun programme passé"
        message="Tu n'as encore généré aucun programme fitness."
      >
        <template #action>
          <RouterLink to="/fitness-program" class="empty-link">
            Générer un programme →
          </RouterLink>
        </template>
      </EmptyState>

      <template v-else-if="programStore.history.length > 0">
        <p class="history-counter" data-testid="history-counter">
          <strong>{{ programStore.history.length }}</strong>
          sur
          <strong>{{ programStore.historyTotal }}</strong>
          programmes
        </p>

        <ul class="history-list" role="list">
          <li
            v-for="program in programStore.history"
            :key="program.program_id"
            class="history-list__item"
            data-testid="program-history-card"
          >
            <RouterLink
              :to="{ name: 'fitness-program-detail', params: { id: program.program_id } }"
              class="history-card"
            >
              <header class="history-card__head">
                <span class="history-card__date">{{ formatCreatedAt(program.created_at) }}</span>
                <AppBadge variant="acid" size="sm">{{ fitnessGoalTag(program.health_goal_at_generation) }}</AppBadge>
                <AppBadge size="sm">{{ tierLabel(program.tier_at_generation) }}</AppBadge>
              </header>

              <p class="history-card__id">{{ program.program_id }}</p>

              <dl class="history-card__stats">
                <div class="history-card__stat">
                  <dt class="history-card__stat-label">Séances</dt>
                  <dd class="history-card__stat-value">{{ totalSessions(program) }}</dd>
                </div>
                <div class="history-card__stat">
                  <dt class="history-card__stat-label">Durée totale</dt>
                  <dd class="history-card__stat-value">{{ totalDurationLabel(program) }}</dd>
                </div>
                <div class="history-card__stat">
                  <dt class="history-card__stat-label">Semaines</dt>
                  <dd class="history-card__stat-value">{{ program.duration_weeks }}</dd>
                </div>
              </dl>
            </RouterLink>
          </li>
        </ul>

        <div v-if="hasMore" class="history-footer">
          <AppButton
            data-testid="history-load-more"
            variant="outline"
            :loading="programStore.historyLoading"
            @click="loadMore"
          >
            Charger plus
          </AppButton>
        </div>
      </template>
    </div>
  </UserLayout>
</template>

<style scoped>
.history {
  display: flex;
  flex-direction: column;
  gap: var(--sp-lg);
  max-width: 960px;
}

.error-banner {
  margin: 0;
  padding: var(--sp-md) var(--sp-lg);
  background: var(--c-coral, #ffe5dc);
  color: var(--c-onyx);
  border-radius: var(--r-md);
  border: 1px solid rgba(255, 107, 74, 0.35);
  font-size: 0.9375rem;
}

.error-banner strong {
  display: block;
  font-weight: 600;
  margin-bottom: 0.15rem;
}

.skeleton {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--sp-md);
  padding: var(--sp-2xl) var(--sp-lg);
  background: #ffffff;
  border-radius: var(--r-lg);
  box-shadow: var(--shadow-soft);
}

.skeleton__text {
  margin: 0;
  color: var(--c-gray-600);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.18em;
}

.empty-link {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-xs);
  padding: 0.7rem 1.3rem;
  border-radius: var(--r-pill);
  background: var(--c-onyx);
  color: var(--c-cream);
  text-decoration: none;
  font-weight: 600;
  font-size: 0.9375rem;
}

.empty-link:hover {
  background: var(--c-onyx-2);
}

.empty-link:focus-visible {
  outline: 2px solid var(--c-acid-dark);
  outline-offset: 3px;
}

.history-counter {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: var(--c-gray-600);
}

.history-counter strong {
  color: var(--c-onyx);
}

.history-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--sp-md);
}

.history-list__item {
  display: flex;
}

.history-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--sp-sm);
  padding: var(--sp-lg);
  background: #ffffff;
  border-radius: var(--r-lg);
  box-shadow: var(--shadow-soft);
  border: 1px solid transparent;
  text-decoration: none;
  color: var(--c-onyx);
  transition: transform var(--d-standard) var(--ease-out-expo),
    border-color var(--d-standard) var(--ease-out-expo),
    box-shadow var(--d-standard) var(--ease-out-expo);
}

.history-card:hover {
  transform: translateY(-1px);
  border-color: rgba(200, 255, 71, 0.45);
  box-shadow: var(--shadow-lift);
}

.history-card:focus-visible {
  outline: 2px solid var(--c-acid-dark);
  outline-offset: 3px;
}

.history-card__head {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-sm);
  align-items: center;
}

.history-card__date {
  flex: 1;
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: var(--c-gray-600);
}

.history-card__id {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.125rem;
  font-weight: 500;
  letter-spacing: -0.01em;
  word-break: break-word;
}

.history-card__stats {
  margin: 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--sp-sm);
  padding-top: var(--sp-sm);
  border-top: 1px solid rgba(20, 20, 20, 0.06);
}

.history-card__stat {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.history-card__stat-label {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 0.5625rem;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: var(--c-gray-600);
}

.history-card__stat-value {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.125rem;
  font-weight: 500;
  letter-spacing: -0.01em;
  color: var(--c-onyx);
}

.history-footer {
  display: flex;
  justify-content: center;
  padding-top: var(--sp-md);
}
</style>
