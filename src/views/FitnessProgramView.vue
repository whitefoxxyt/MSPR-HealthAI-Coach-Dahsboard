<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import UserLayout from '@/layouts/UserLayout.vue'
import AppButton from '@/components/ui/AppButton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import RateLimitBanner from '@/components/ui/RateLimitBanner.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import ProgramSummary from '@/components/ProgramSummary.vue'
import WorkoutCard from '@/components/WorkoutCard.vue'
import FeedbackForm from '@/components/FeedbackForm.vue'
import { useFitnessProfileStore } from '@/stores/fitnessProfile'
import { useFitnessProgramStore } from '@/stores/fitnessProgram'
import { useProgramFeedbackStore } from '@/stores/programFeedback'
import type { HealthGoalFitness, ProgramFeedbackBody } from '@/services/recoFitnessApi'

const profileStore = useFitnessProfileStore()
const programStore = useFitnessProgramStore()
const feedbackStore = useProgramFeedbackStore()

const RATE_LIMIT_FALLBACK_SECONDS = 60

const rateLimit = ref<number | null>(null)
const feedbackOpen = ref(false)
const feedbackRateLimit = ref<number | null>(null)
const feedbackPanelRef = ref<HTMLElement | null>(null)

const profileReady = computed(() => profileStore.profile !== null)
const profileMissing = computed(
  () => profileStore.error === null && !profileStore.loading && !profileReady.value,
)

const goalTag = computed<string>(() => {
  const goal: HealthGoalFitness | undefined = profileStore.profile?.health_goal_fitness
  switch (goal) {
    case 'muscle_strength':
      return 'Force'
    case 'fat_loss':
      return 'Cardio'
    case 'endurance':
      return 'Endurance'
    case 'general_health':
      return 'Santé'
    default:
      return 'Personnalisé'
  }
})

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

watch(
  () => feedbackStore.error,
  (err) => {
    if (err?.status === 429) {
      feedbackRateLimit.value = err.retryAfter ?? RATE_LIMIT_FALLBACK_SECONDS
    }
  },
)

const feedbackErrorMessage = computed<string>(() => {
  const status = feedbackStore.error?.status
  if (status === undefined) return ''
  if (status >= 500) return 'Service indisponible. Réessaie dans un instant.'
  if (status === 404) return 'Programme introuvable.'
  if (status === 401) return 'Session expirée. Reconnecte-toi.'
  return 'Impossible d’envoyer le feedback.'
})

const feedbackExercises = computed<{ id: number; name: string }[]>(() => {
  const program = programStore.program
  if (!program) return []
  const seen = new Map<number, string>()
  for (const week of program.weeks) {
    for (const session of week) {
      for (const ex of session) {
        if (!seen.has(ex.id)) seen.set(ex.id, ex.name)
      }
    }
  }
  return Array.from(seen, ([id, name]) => ({ id, name }))
})

async function generate() {
  rateLimit.value = null
  await programStore.submitProgram()
}

function openFeedback() {
  feedbackStore.clearError()
  feedbackStore.clearLastSubmitted()
  feedbackRateLimit.value = null
  feedbackOpen.value = true
}

function closeFeedback() {
  feedbackOpen.value = false
  feedbackRateLimit.value = null
}

async function submitFeedback(body: ProgramFeedbackBody) {
  const program = programStore.program
  if (!program) return
  await feedbackStore.submit(program.program_id, body)
  if (feedbackStore.lastSubmitted) {
    closeFeedback()
  }
}

function dismissSuccess() {
  feedbackStore.clearLastSubmitted()
}

watch(feedbackOpen, async (open) => {
  if (open) {
    await nextTick()
    feedbackPanelRef.value?.focus()
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

onBeforeUnmount(() => {
  document.body.style.overflow = ''
})

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
            <AppButton
              data-testid="program-feedback-cta"
              variant="outline"
              @click="openFeedback"
            >
              Donner un feedback
            </AppButton>
            <span
              data-testid="program-history-link"
              class="program-link program-link--disabled"
              aria-disabled="true"
              role="link"
            >
              Historique <span class="program-link__hint">(bientôt)</span>
            </span>
          </div>

          <div
            v-if="feedbackStore.lastSubmitted"
            data-testid="feedback-success"
            role="status"
            aria-live="polite"
            class="feedback-success"
          >
            <span class="feedback-success__text">
              Merci, ton feedback a été envoyé.
            </span>
            <button
              type="button"
              class="feedback-success__close"
              aria-label="Fermer"
              @click="dismissSuccess"
            >×</button>
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

      <Transition name="feedback-fade">
        <div
          v-if="feedbackOpen && programStore.program"
          data-testid="feedback-modal"
          class="feedback-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="feedback-modal-title"
          @click.self="closeFeedback"
        >
          <div
            ref="feedbackPanelRef"
            class="feedback-modal__panel"
            tabindex="-1"
            @keydown.esc.stop="closeFeedback"
          >
            <header class="feedback-modal__head">
              <h2 id="feedback-modal-title" class="feedback-modal__title">
                Feedback sur le programme
              </h2>
              <button
                type="button"
                class="feedback-modal__close"
                aria-label="Fermer"
                @click="closeFeedback"
              >×</button>
            </header>

            <RateLimitBanner
              v-if="feedbackRateLimit"
              data-testid="feedback-rate-limit"
              :retry-after="feedbackRateLimit"
              message="Limite atteinte. Réessaie dans"
              @dismiss="feedbackRateLimit = null"
            />

            <p
              v-else-if="feedbackStore.error"
              role="alert"
              data-testid="feedback-error"
              class="feedback-error"
            >
              <strong>Erreur</strong>
              {{ feedbackErrorMessage }}
            </p>

            <FeedbackForm
              :exercises="feedbackExercises"
              :loading="feedbackStore.loading"
              @submit="submitFeedback"
              @cancel="closeFeedback"
            />
          </div>
        </div>
      </Transition>
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

.feedback-success {
  display: flex;
  align-items: center;
  gap: var(--sp-md);
  padding: var(--sp-md) var(--sp-lg);
  background: var(--c-acid);
  color: var(--c-onyx);
  border-radius: var(--r-md);
  font-size: 0.9375rem;
  border: 1px solid var(--c-acid-dark);
}

.feedback-success__text {
  flex: 1;
  font-weight: 600;
}

.feedback-success__close {
  width: 28px;
  height: 28px;
  border-radius: var(--r-pill);
  background: transparent;
  border: none;
  color: inherit;
  font-size: 1.25rem;
  cursor: pointer;
  opacity: 0.7;
}

.feedback-success__close:hover {
  opacity: 1;
}

.feedback-success__close:focus-visible {
  outline: 2px solid var(--c-onyx);
  outline-offset: 2px;
}

.feedback-modal {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--sp-lg);
  background: rgba(20, 20, 20, 0.55);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

.feedback-modal__panel {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--sp-md);
  width: 100%;
  max-width: 520px;
  max-height: min(90vh, 720px);
  padding: var(--sp-lg);
  background: #ffffff;
  border-radius: var(--r-lg);
  box-shadow: var(--shadow-lift, 0 24px 48px rgba(0, 0, 0, 0.25));
  overflow-y: auto;
  outline: none;
}

.feedback-modal__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-md);
}

.feedback-modal__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 500;
  color: var(--c-onyx);
}

.feedback-modal__close {
  width: 32px;
  height: 32px;
  border-radius: var(--r-pill);
  background: transparent;
  border: 1px solid transparent;
  color: var(--c-gray-600);
  font-size: 1.25rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.feedback-modal__close:hover {
  background: var(--c-cream-2, rgba(20, 20, 20, 0.05));
  color: var(--c-onyx);
}

.feedback-modal__close:focus-visible {
  outline: 2px solid var(--c-acid-dark);
  outline-offset: 2px;
}

.feedback-error {
  margin: 0;
  padding: var(--sp-md) var(--sp-lg);
  background: var(--c-coral, #ffe5dc);
  color: var(--c-onyx);
  border-radius: var(--r-md);
  border: 1px solid rgba(255, 107, 74, 0.35);
  font-size: 0.9375rem;
}

.feedback-error strong {
  display: block;
  font-weight: 600;
  margin-bottom: 0.15rem;
}

.feedback-fade-enter-active,
.feedback-fade-leave-active {
  transition: opacity 0.2s ease;
}

.feedback-fade-enter-active .feedback-modal__panel,
.feedback-fade-leave-active .feedback-modal__panel {
  transition: transform 0.2s ease;
}

.feedback-fade-enter-from,
.feedback-fade-leave-to {
  opacity: 0;
}

.feedback-fade-enter-from .feedback-modal__panel,
.feedback-fade-leave-to .feedback-modal__panel {
  transform: translateY(12px);
}

@media (prefers-reduced-motion: reduce) {
  .feedback-fade-enter-active,
  .feedback-fade-leave-active,
  .feedback-fade-enter-active .feedback-modal__panel,
  .feedback-fade-leave-active .feedback-modal__panel {
    transition: none;
  }
}
</style>
