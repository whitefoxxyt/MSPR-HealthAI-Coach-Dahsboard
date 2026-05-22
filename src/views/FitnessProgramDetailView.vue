<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import UserLayout from '@/layouts/UserLayout.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ExportActions from '@/components/ui/ExportActions.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import RateLimitBanner from '@/components/ui/RateLimitBanner.vue'
import ProgramSummary from '@/components/ProgramSummary.vue'
import WorkoutCard from '@/components/WorkoutCard.vue'
import { useFitnessProgramStore } from '@/stores/fitnessProgram'
import { exportProgramJson, exportProgramPdf } from '@/services/exportService'
import { fitnessGoalTag } from '@/utils/fitnessGoals'

const DETAIL_LOOKUP_LIMIT = 50
const RATE_LIMIT_FALLBACK_SECONDS = 60

const route = useRoute()
const programStore = useFitnessProgramStore()
const rateLimit = ref<number | null>(null)

const programId = computed(() => String(route.params.id ?? ''))

const program = computed(() => {
  if (!programId.value) return null
  return programStore.findProgramById(programId.value)
})

const goalTag = computed<string>(() => fitnessGoalTag(program.value?.health_goal_at_generation))

const isLoading = computed(
  () => programStore.historyLoading && program.value === null,
)
const isNotFound = computed(
  () =>
    !programStore.historyLoading
    && program.value === null
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

onMounted(() => {
  void programStore.loadHistory(DETAIL_LOOKUP_LIMIT, 0)
})
</script>

<template>
  <UserLayout eyebrow="Performance" title="Programme">
    <div class="detail">
      <RateLimitBanner
        v-if="rateLimit"
        data-testid="detail-rate-limit"
        :retry-after="rateLimit"
        message="Limite atteinte. Réessaie dans"
        @dismiss="rateLimit = null"
      />
      <p
        v-else-if="programStore.historyError"
        role="alert"
        data-testid="detail-error"
        class="error-banner"
      >
        <strong>Erreur</strong>
        {{ errorMessage }}
      </p>

      <div v-if="isLoading" data-testid="detail-loading" class="loading">
        <LoadingSpinner size="lg" accent="acid" label="Chargement du programme" />
        <p class="loading__text">Chargement du programme…</p>
      </div>

      <EmptyState
        v-else-if="isNotFound"
        data-testid="program-not-found"
        icon="✦"
        title="Programme introuvable"
        message="Ce programme n'existe pas (ou plus). Reviens à l'historique pour retrouver tes anciens programmes."
      >
        <template #action>
          <RouterLink to="/fitness-programs" class="back-link">
            ← Retour à l'historique
          </RouterLink>
        </template>
      </EmptyState>

      <template v-else-if="program">
        <div class="detail-head">
          <RouterLink to="/fitness-programs" class="breadcrumb" data-testid="back-to-history">
            ← Historique
          </RouterLink>
          <ExportActions
            aria-label="Exporter le programme"
            @export-pdf="exportProgramPdf(program)"
            @export-json="exportProgramJson(program)"
          />
        </div>

        <ProgramSummary :program="program" :tag="goalTag" />

        <section
          v-for="(week, weekIndex) in program.weeks"
          :key="weekIndex"
          class="program-week"
          :data-testid="`program-week-${weekIndex}`"
        >
          <header class="program-week__head">
            <span class="program-week__eyebrow">Semaine {{ weekIndex + 1 }}</span>
          </header>
          <div
            v-for="(session, sessionIndex) in week"
            :key="sessionIndex"
            class="program-day"
            :data-testid="`program-day-${weekIndex}-${sessionIndex}`"
          >
            <h3 class="program-day__title">Jour {{ sessionIndex + 1 }}</h3>
            <div class="program-day__list">
              <WorkoutCard
                v-for="(ex, exIndex) in session"
                :key="`${ex.id}-${exIndex}`"
                :exercise="ex"
                :position="exIndex + 1"
              />
            </div>
          </div>
        </section>
      </template>
    </div>
  </UserLayout>
</template>

<style scoped>
.detail {
  display: flex;
  flex-direction: column;
  gap: var(--sp-lg);
  max-width: 920px;
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

.loading {
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

.loading__text {
  margin: 0;
  color: var(--c-gray-600);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.18em;
}

.back-link {
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

.back-link:hover {
  background: var(--c-onyx-2);
}

.back-link:focus-visible {
  outline: 2px solid var(--c-acid-dark);
  outline-offset: 3px;
}

.detail-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--sp-md);
  flex-wrap: wrap;
}

.breadcrumb {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-xs);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: var(--c-gray-800);
  text-decoration: none;
  width: fit-content;
  padding: 0.4rem 0.85rem;
  border-radius: var(--r-pill);
  border: 1px solid rgba(20, 20, 20, 0.10);
}

.breadcrumb:hover {
  background: rgba(20, 20, 20, 0.05);
}

.breadcrumb:focus-visible {
  outline: 2px solid var(--c-acid-dark);
  outline-offset: 2px;
}

.program-week {
  display: flex;
  flex-direction: column;
  gap: var(--sp-md);
}

.program-week__head {
  display: flex;
  align-items: center;
  gap: var(--sp-md);
}

.program-week__eyebrow {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  text-transform: uppercase;
  letter-spacing: 0.22em;
  color: var(--c-gray-600);
}

.program-day {
  display: flex;
  flex-direction: column;
  gap: var(--sp-sm);
  padding: var(--sp-lg);
  background: #ffffff;
  border-radius: var(--r-lg);
  box-shadow: var(--shadow-soft);
}

.program-day__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 500;
  letter-spacing: -0.01em;
  color: var(--c-onyx);
}

.program-day__list {
  display: flex;
  flex-direction: column;
  gap: var(--sp-sm);
}
</style>
