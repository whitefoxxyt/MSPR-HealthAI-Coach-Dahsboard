<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import UserLayout from '@/layouts/UserLayout.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppChip from '@/components/ui/AppChip.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import RateLimitBanner from '@/components/ui/RateLimitBanner.vue'
import MealCalendar from '@/components/MealCalendar.vue'
import { useNutritionGoalsStore } from '@/stores/nutritionGoals'
import { useMealPlanStore } from '@/stores/mealPlan'
import type {
  DietType,
  HealthGoal,
  MealPlanRequest,
} from '@/services/aiNutritionApi'

const HEALTH_GOAL_OPTIONS: Array<{ value: HealthGoal; label: string }> = [
  { value: 'weight_loss', label: 'Perte de poids' },
  { value: 'muscle_gain', label: 'Prise de masse' },
  { value: 'balance', label: 'Équilibre' },
  { value: 'sport_performance', label: 'Performance sportive' },
]

const DIET_TYPE_OPTIONS: Array<{ value: DietType; label: string }> = [
  { value: 'omnivore', label: 'Omnivore' },
  { value: 'vegetarien', label: 'Végétarien' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'sans_gluten', label: 'Sans gluten' },
]

const ALLERGY_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'arachides', label: 'Arachides' },
  { value: 'fruits a coque', label: 'Fruits à coque' },
  { value: 'gluten', label: 'Gluten' },
  { value: 'lactose', label: 'Lactose' },
  { value: 'oeufs', label: 'Œufs' },
  { value: 'soja', label: 'Soja' },
  { value: 'poisson', label: 'Poisson' },
  { value: 'crustaces', label: 'Crustacés' },
  { value: 'sesame', label: 'Sésame' },
]

const DEFAULT_DURATION = 7

interface MealPlanForm {
  health_goal: HealthGoal
  diet_type: DietType
  duration_days: string
  allergies: string[]
  budget_eur_per_day: string
}

const nutritionStore = useNutritionGoalsStore()
const mealPlanStore = useMealPlanStore()

const form = reactive<MealPlanForm>({
  health_goal: 'balance',
  diet_type: 'omnivore',
  duration_days: String(DEFAULT_DURATION),
  allergies: [],
  budget_eur_per_day: '',
})

const errors = reactive<{ duration: string | null; budget: string | null }>({
  duration: null,
  budget: null,
})

const rateLimit = ref<number | null>(null)

watch(
  () => nutritionStore.goals,
  (goals) => {
    if (!goals) return
    form.health_goal = (goals.health_goal ?? 'balance') as HealthGoal
    form.diet_type = (goals.diet_type ?? 'omnivore') as DietType
    form.allergies = [...(goals.allergies ?? [])]
  },
  { immediate: true },
)

watch(
  () => mealPlanStore.error,
  (err) => {
    if (err?.status === 429 && err.retryAfter) {
      rateLimit.value = err.retryAfter
    }
  },
)

const step = computed<'form' | 'loading' | 'result'>(() => {
  if (mealPlanStore.loading) return 'loading'
  if (mealPlanStore.currentPlan && !mealPlanStore.error) return 'result'
  return 'form'
})

const profileLoaded = computed(
  () => !nutritionStore.loading || nutritionStore.goals !== null,
)
const needsProfile = computed(() => profileLoaded.value && nutritionStore.goals === null)

function toggleInList(list: string[], value: string) {
  const idx = list.indexOf(value)
  if (idx >= 0) {
    list.splice(idx, 1)
  } else {
    list.push(value)
  }
}

function validate(): boolean {
  errors.duration = null
  errors.budget = null

  const duration = Number(form.duration_days)
  if (!Number.isFinite(duration) || duration < 1 || duration > 30) {
    errors.duration = 'Durée invalide. Choisis une valeur entre 1 et 30 jours.'
  }

  if (form.budget_eur_per_day !== '') {
    const budget = Number(form.budget_eur_per_day)
    if (!Number.isFinite(budget) || budget <= 0) {
      errors.budget = 'Le budget doit être supérieur à 0.'
    }
  }

  return errors.duration === null && errors.budget === null
}

function buildRequest(): MealPlanRequest {
  const payload: MealPlanRequest = {
    health_goal: form.health_goal,
    diet_type: form.diet_type,
    duration_days: Number(form.duration_days),
    allergies: [...form.allergies],
  }
  if (form.budget_eur_per_day !== '') {
    payload.budget_eur_per_day = Number(form.budget_eur_per_day)
  }
  return payload
}

async function onSubmit() {
  if (!validate()) return
  rateLimit.value = null
  await mealPlanStore.submitPlan(buildRequest())
}

function onNewPlan() {
  mealPlanStore.reset()
  rateLimit.value = null
}

onMounted(() => {
  void nutritionStore.fetchGoals()
})
</script>

<template>
  <UserLayout eyebrow="IA · Nutrition" title="Plan repas">
    <div class="meal-plan">
      <EmptyState
        v-if="needsProfile"
        data-testid="meal-plan-empty"
        icon="✦"
        title="Complète ton profil nutritionnel"
        message="Renseigne d'abord ton régime, tes allergies et ton objectif santé sur la page Profil & objectifs pour générer un plan repas."
      >
        <template #action>
          <RouterLink to="/profil" class="meal-plan__profile-link">
            Aller sur Profil & objectifs →
          </RouterLink>
        </template>
      </EmptyState>

      <AppCard
        v-else-if="step === 'form'"
        eyebrow="01 · Paramètres"
        title="Génère ton plan"
      >
        <RateLimitBanner
          v-if="rateLimit"
          data-testid="meal-plan-rate-limit"
          :retry-after="rateLimit"
          @dismiss="rateLimit = null"
        />
        <p
          v-else-if="mealPlanStore.error"
          role="alert"
          data-testid="meal-plan-error"
          class="meal-plan__error"
        >
          <strong>Erreur</strong>
          {{ mealPlanStore.error.status >= 500
            ? 'Service nutrition indisponible. Réessaye dans un instant.'
            : mealPlanStore.error.status === 408
              ? 'La génération a pris trop de temps. Réessaye.'
              : 'Impossible de générer le plan repas.' }}
        </p>

        <form
          data-testid="meal-plan-form"
          class="meal-plan__form"
          @submit.prevent="onSubmit"
        >
          <div data-testid="form-health-goal">
            <AppSelect
              v-model="form.health_goal"
              label="Objectif santé"
              :options="HEALTH_GOAL_OPTIONS"
            />
          </div>

          <div data-testid="form-diet-type">
            <AppSelect
              v-model="form.diet_type"
              label="Type de régime"
              :options="DIET_TYPE_OPTIONS"
            />
          </div>

          <div class="meal-plan__grid-2">
            <div data-testid="form-duration">
              <AppInput
                v-model="form.duration_days"
                label="Durée (jours)"
                type="number"
                hint="Entre 1 et 30 jours."
                :error="errors.duration ?? undefined"
              />
            </div>
            <div data-testid="form-budget">
              <AppInput
                v-model="form.budget_eur_per_day"
                label="Budget par jour (€)"
                type="number"
                hint="Optionnel. Doit être supérieur à 0."
                :error="errors.budget ?? undefined"
              />
            </div>
          </div>

          <fieldset class="meal-plan__chips">
            <legend class="meal-plan__chips-legend">Allergies</legend>
            <div class="meal-plan__chips-list" data-testid="form-allergies">
              <AppChip
                v-for="opt in ALLERGY_OPTIONS"
                :key="opt.value"
                :selected="form.allergies.includes(opt.value)"
                @toggle="toggleInList(form.allergies, opt.value)"
              >
                {{ opt.label }}
              </AppChip>
            </div>
          </fieldset>

          <div class="meal-plan__actions">
            <AppButton type="submit" :loading="mealPlanStore.loading">
              Générer le plan
            </AppButton>
          </div>
        </form>
      </AppCard>

      <AppCard
        v-else-if="step === 'loading'"
        eyebrow="02 · Génération"
        title="On cuisine ton plan…"
      >
        <div data-testid="meal-plan-loading" class="meal-plan__loading">
          <div class="meal-plan__skeleton" aria-hidden="true">
            <div class="meal-plan__skeleton-bar" />
            <div class="meal-plan__skeleton-bar meal-plan__skeleton-bar--short" />
            <div class="meal-plan__skeleton-bar" />
            <div class="meal-plan__skeleton-bar meal-plan__skeleton-bar--short" />
          </div>
          <p class="meal-plan__loading-text">
            Génération en cours, cela peut prendre quelques minutes…
          </p>
        </div>
      </AppCard>

      <section
        v-else-if="step === 'result' && mealPlanStore.currentPlan"
        data-testid="meal-plan-result"
        class="meal-plan__result"
      >
        <MealCalendar :days="mealPlanStore.currentPlan.days" />

        <footer data-testid="meal-plan-footer" class="meal-plan__footer">
          <p class="meal-plan__footer-line">
            <span class="meal-plan__footer-label">Moteur</span>
            <span class="meal-plan__footer-value">{{ mealPlanStore.currentPlan.llm_backend_used }}</span>
          </p>
          <p class="meal-plan__footer-line">
            <span class="meal-plan__footer-label">Budget total estimé</span>
            <span class="meal-plan__footer-value">{{ mealPlanStore.currentPlan.total_budget_eur }} €</span>
          </p>

          <div class="meal-plan__footer-actions">
            <AppButton
              variant="acid"
              data-testid="meal-plan-reset"
              @click="onNewPlan"
            >
              Nouveau plan
            </AppButton>
            <a
              data-testid="meal-plan-history-link"
              class="meal-plan__history"
              href="#historique"
              aria-disabled="true"
              title="Disponible bientôt (slice S6)"
            >Historique →</a>
          </div>
        </footer>
      </section>
    </div>
  </UserLayout>
</template>

<style scoped>
.meal-plan {
  display: flex;
  flex-direction: column;
  gap: var(--sp-lg);
  max-width: 1100px;
}

.meal-plan__profile-link {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-xs);
  padding: 0.6rem 1.1rem;
  background: var(--c-onyx);
  color: var(--c-cream);
  border-radius: var(--r-pill);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
}

.meal-plan__profile-link:hover {
  background: var(--c-onyx-2);
}

.meal-plan__form {
  display: flex;
  flex-direction: column;
  gap: var(--sp-md);
}

.meal-plan__grid-2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--sp-md);
}

@media (max-width: 640px) {
  .meal-plan__grid-2 {
    grid-template-columns: 1fr;
  }
}

.meal-plan__chips {
  border: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--sp-sm);
}

.meal-plan__chips-legend {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--c-gray-800);
  padding: 0;
}

.meal-plan__chips-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-xs);
}

.meal-plan__actions {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--sp-sm);
}

.meal-plan__error {
  margin: 0 0 var(--sp-md);
  padding: var(--sp-md) var(--sp-lg);
  background: var(--c-coral, #ffe5dc);
  color: var(--c-onyx);
  border-radius: var(--r-md);
  border: 1px solid rgba(255, 107, 74, 0.35);
  font-size: 0.9375rem;
}

.meal-plan__error strong {
  display: block;
  font-weight: 600;
  margin-bottom: 0.15rem;
}

.meal-plan__loading {
  display: flex;
  flex-direction: column;
  gap: var(--sp-md);
  padding: var(--sp-md) 0;
}

.meal-plan__skeleton {
  display: flex;
  flex-direction: column;
  gap: var(--sp-sm);
}

.meal-plan__skeleton-bar {
  height: 14px;
  border-radius: var(--r-sm);
  background: linear-gradient(
    90deg,
    var(--c-cream-2) 0%,
    rgba(20, 20, 20, 0.08) 50%,
    var(--c-cream-2) 100%
  );
  background-size: 200% 100%;
  animation: meal-plan-shimmer 1.6s linear infinite;
}

.meal-plan__skeleton-bar--short {
  width: 60%;
}

.meal-plan__loading-text {
  margin: 0;
  font-size: 0.9375rem;
  color: var(--c-gray-800);
  font-style: italic;
}

@keyframes meal-plan-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@media (prefers-reduced-motion: reduce) {
  .meal-plan__skeleton-bar {
    animation: none;
  }
}

.meal-plan__result {
  display: flex;
  flex-direction: column;
  gap: var(--sp-lg);
}

.meal-plan__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--sp-md) var(--sp-lg);
  padding: var(--sp-lg);
  background: #ffffff;
  border-radius: var(--r-lg);
  box-shadow: var(--shadow-soft);
}

.meal-plan__footer-line {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.meal-plan__footer-label {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--c-gray-600);
}

.meal-plan__footer-value {
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 500;
  color: var(--c-onyx);
}

.meal-plan__footer-actions {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-md);
  margin-left: auto;
}

.meal-plan__history {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--c-gray-600);
  text-decoration: none;
  cursor: not-allowed;
}

.meal-plan__history:hover {
  color: var(--c-onyx);
}
</style>
