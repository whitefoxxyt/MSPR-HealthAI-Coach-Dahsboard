<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import UserLayout from '@/layouts/UserLayout.vue'
import AppButton from '@/components/ui/AppButton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import RateLimitBanner from '@/components/ui/RateLimitBanner.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import ProgramSummary from '@/components/ProgramSummary.vue'
import WorkoutCard from '@/components/WorkoutCard.vue'
import { useFitnessProfileStore } from '@/stores/fitnessProfile'
import { useFitnessProgramStore } from '@/stores/fitnessProgram'
import { fitnessGoalTag } from '@/utils/fitnessGoals'

const profileStore = useFitnessProfileStore()
const programStore = useFitnessProgramStore()

const RATE_LIMIT_FALLBACK_SECONDS = 60

const rateLimit = ref<number | null>(null)

const profileReady = computed(() => profileStore.profile !== null)
const profileMissing = computed(
  () => profileStore.error === null && !profileStore.loading && !profileReady.value,
)

const goalTag = computed<string>(() => fitnessGoalTag(profileStore.profile?.health_goal_fitness))

const errorMessage = computed<string>(() => {
  const status = programStore.error?.status
  if (status === undefined) return ''
  if (status >= 500) return 'Service de recommandation indisponible. Réessaye dans un instant.'
  if (status === 409) {
    return 'Impossible de générer un programme : aucun exercice ne passe tes filtres (équipement, limitations). Ajuste ton profil.'
  }
  if (status === 401) return 'Session expirée. Reconnecte-toi.'
  return 'Une erreur est survenue.'
})

watch(
  () => programStore.error,
  (err) => {
    if (err?.status === 429) {
      rateLimit.value = err.retryAfter ?? RATE_LIMIT_FALLBACK_SECONDS
    }
  },
)

async function generate() {
  rateLimit.value = null
  await programStore.submitProgram()
}

onMounted(() => {
  void profileStore.fetchProfile()
})
</script>

<template>
  <UserLayout eyebrow="Performance" title="Programme fitness">
    <div class="fitness-program">
      <EmptyState
        v-if="profileMissing"
        data-testid="fitness-profile-missing"
        icon="✦"
        title="Profil fitness incomplet"
        message="Renseigne ton objectif, ton niveau et ton équipement avant de générer ton premier programme."
      >
        <template #action>
          <RouterLink to="/profil" class="profile-link">
            Compléter mon profil →
          </RouterLink>
        </template>
      </EmptyState>

      <template v-else-if="profileReady">
        <RateLimitBanner
          v-if="rateLimit"
          data-testid="program-rate-limit"
          :retry-after="rateLimit"
          message="Limite atteinte (10 / heure). Réessaie dans"
          @dismiss="rateLimit = null"
        />

        <p
          v-else-if="programStore.error"
          role="alert"
          data-testid="program-error"
          class="error-banner"
        >
          <strong>Erreur</strong>
          {{ errorMessage }}
        </p>

        <div v-if="programStore.loading" data-testid="program-skeleton" class="skeleton">
          <LoadingSpinner size="lg" accent="acid" label="Génération du programme en cours" />
          <p class="skeleton__text">Génération de ton programme…</p>
        </div>

        <template v-else-if="programStore.program">
          <ProgramSummary :program="programStore.program" :tag="goalTag" />

          <section
            v-for="(week, weekIndex) in programStore.program.weeks"
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

          <div class="program-actions">
            <AppButton
              data-testid="new-program-cta"
              variant="acid"
              :loading="programStore.loading"
              @click="generate"
            >
              Nouveau programme
            </AppButton>
            <RouterLink
              data-testid="program-history-link"
              to="/fitness-programs"
              class="program-link"
            >
              Historique
            </RouterLink>
            <span
              data-testid="program-feedback-link"
              class="program-link program-link--disabled"
              aria-disabled="true"
              role="link"
            >
              Feedback <span class="program-link__hint">(bientôt)</span>
            </span>
          </div>
        </template>

        <div v-else class="program-cta">
          <p class="program-cta__lead">
            Génère un programme personnalisé adapté à ton objectif, ton niveau et ton équipement.
          </p>
          <AppButton
            data-testid="generate-program-cta"
            variant="acid"
            size="lg"
            :loading="programStore.loading"
            @click="generate"
          >
            Générer un programme
          </AppButton>
        </div>
      </template>

      <div v-else class="profile-loading">
        <LoadingSpinner size="md" label="Chargement du profil" />
      </div>
    </div>
  </UserLayout>
</template>

<style scoped>
.fitness-program {
  display: flex;
  flex-direction: column;
  gap: var(--sp-lg);
  max-width: 920px;
}

.profile-link {
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

.profile-link:hover {
  background: var(--c-onyx-2);
}

.profile-link:focus-visible {
  outline: 2px solid var(--c-acid-dark);
  outline-offset: 3px;
}

.program-cta {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--sp-md);
  padding: var(--sp-xl) var(--sp-lg);
  background: #ffffff;
  border-radius: var(--r-lg);
  box-shadow: var(--shadow-soft);
}

.program-cta__lead {
  margin: 0;
  font-size: 1rem;
  line-height: 1.5;
  color: var(--c-gray-800);
  max-width: 56ch;
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

.program-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--sp-md);
  padding-top: var(--sp-md);
}

.program-link {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-xs);
  padding: 0.6rem 1.1rem;
  border-radius: var(--r-pill);
  text-decoration: none;
  font-size: 0.875rem;
  color: var(--c-gray-800);
  border: 1px solid rgba(20, 20, 20, 0.10);
}

.program-link--disabled {
  opacity: 0.55;
  pointer-events: none;
}

.program-link__hint {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  color: var(--c-gray-600);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.profile-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--sp-2xl);
}
</style>
