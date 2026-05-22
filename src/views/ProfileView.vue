<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import UserLayout from '@/layouts/UserLayout.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppChip from '@/components/ui/AppChip.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import RateLimitBanner from '@/components/ui/RateLimitBanner.vue'
import { useNutritionGoalsStore } from '@/stores/nutritionGoals'
import { useFitnessProfileStore } from '@/stores/fitnessProfile'
import type { DietType, HealthGoal } from '@/services/aiNutritionApi'
import type {
  ExperienceLevel,
  HealthGoalFitness,
} from '@/services/recoFitnessApi'

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

const GENDER_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '', label: 'Non renseigné' },
  { value: 'male', label: 'Homme' },
  { value: 'female', label: 'Femme' },
]

const ACTIVITY_LEVEL_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '', label: 'Non renseigné' },
  { value: 'sedentary', label: 'Sédentaire' },
  { value: 'light', label: 'Légère (1-3 séances/semaine)' },
  { value: 'moderate', label: 'Modérée (3-5 séances/semaine)' },
  { value: 'active', label: 'Active (6-7 séances/semaine)' },
  { value: 'very_active', label: 'Très active (sport quotidien intense)' },
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

const FITNESS_GOAL_OPTIONS: Array<{ value: HealthGoalFitness; label: string }> = [
  { value: 'fat_loss', label: 'Perte de gras' },
  { value: 'muscle_strength', label: 'Force / Musculation' },
  { value: 'endurance', label: 'Endurance' },
  { value: 'general_health', label: 'Santé générale' },
]

const EXPERIENCE_LEVEL_OPTIONS: Array<{ value: ExperienceLevel; label: string }> = [
  { value: 'beginner', label: 'Débutant' },
  { value: 'intermediate', label: 'Intermédiaire' },
  { value: 'advanced', label: 'Avancé' },
]

const EQUIPMENT_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'dumbbell', label: 'Haltères' },
  { value: 'bench', label: 'Banc' },
  { value: 'barbell', label: 'Barre' },
  { value: 'kettlebell', label: 'Kettlebell' },
  { value: 'resistance_band', label: 'Élastiques' },
  { value: 'pull_up_bar', label: 'Barre de traction' },
  { value: 'treadmill', label: 'Tapis de course' },
  { value: 'bike', label: 'Vélo' },
]

const LIMITATION_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'knee', label: 'Genou' },
  { value: 'back', label: 'Dos' },
  { value: 'shoulder', label: 'Épaule' },
  { value: 'wrist', label: 'Poignet' },
  { value: 'ankle', label: 'Cheville' },
  { value: 'hip', label: 'Hanche' },
]

const nutritionStore = useNutritionGoalsStore()
const fitnessStore = useFitnessProfileStore()

interface GoalsForm {
  health_goal: HealthGoal
  calories_target: string
  protein_g: string
  carbs_g: string
  fat_g: string
  allergies: string[]
  diet_type: DietType
  gender: '' | 'male' | 'female'
  age: string
  weight_kg: string
  height_cm: string
  activity_level: '' | 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
}

interface FitnessForm {
  health_goal_fitness: HealthGoalFitness
  experience_level: ExperienceLevel
  equipment: string[]
  limitations: string[]
  duration_min_per_session: string
  sessions_per_week: string
}

const goalsForm = reactive<GoalsForm>({
  health_goal: 'balance',
  calories_target: '',
  protein_g: '',
  carbs_g: '',
  fat_g: '',
  allergies: [],
  diet_type: 'omnivore',
  gender: '',
  age: '',
  weight_kg: '',
  height_cm: '',
  activity_level: '',
})

const fitnessForm = reactive<FitnessForm>({
  health_goal_fitness: 'general_health',
  experience_level: 'beginner',
  equipment: [],
  limitations: [],
  duration_min_per_session: '45',
  sessions_per_week: '3',
})

const goalsSubmitting = ref(false)
const fitnessSubmitting = ref(false)
const goalsRateLimit = ref<number | null>(null)
const macrosRateLimit = ref<number | null>(null)
const fitnessRateLimit = ref<number | null>(null)

watch(
  () => nutritionStore.goals,
  (goals) => {
    if (!goals) return
    goalsForm.health_goal = (goals.health_goal ?? 'balance') as HealthGoal
    goalsForm.calories_target = goals.calories_target?.toString() ?? ''
    goalsForm.protein_g = goals.protein_g ? Number.parseFloat(goals.protein_g).toString() : ''
    goalsForm.carbs_g = goals.carbs_g ? Number.parseFloat(goals.carbs_g).toString() : ''
    goalsForm.fat_g = goals.fat_g ? Number.parseFloat(goals.fat_g).toString() : ''
    goalsForm.allergies = [...(goals.allergies ?? [])]
    goalsForm.diet_type = (goals.diet_type ?? 'omnivore') as DietType
    goalsForm.gender = (goals.gender ?? '') as GoalsForm['gender']
    goalsForm.age = goals.age != null ? String(goals.age) : ''
    goalsForm.weight_kg = goals.weight_kg != null ? String(goals.weight_kg) : ''
    goalsForm.height_cm = goals.height_cm != null ? String(goals.height_cm) : ''
    goalsForm.activity_level = (goals.activity_level ?? '') as GoalsForm['activity_level']
  },
  { immediate: true },
)

watch(
  () => fitnessStore.profile,
  (profile) => {
    if (!profile) return
    fitnessForm.health_goal_fitness = profile.health_goal_fitness
    fitnessForm.experience_level = profile.experience_level
    fitnessForm.equipment = [...profile.equipment]
    fitnessForm.limitations = [...profile.limitations]
    fitnessForm.duration_min_per_session = profile.preferences.duration_min_per_session.toString()
    fitnessForm.sessions_per_week = profile.preferences.sessions_per_week.toString()
  },
  { immediate: true },
)

watch(
  () => nutritionStore.error,
  (err) => {
    if (err?.status === 429 && err.retryAfter) {
      goalsRateLimit.value = err.retryAfter
    }
  },
)

watch(
  () => nutritionStore.macrosError,
  (err) => {
    if (err?.status === 429 && err.retryAfter) {
      macrosRateLimit.value = err.retryAfter
    }
  },
)

watch(
  () => fitnessStore.error,
  (err) => {
    if (err?.status === 429 && err.retryAfter) {
      fitnessRateLimit.value = err.retryAfter
    }
  },
)

const macrosState = computed(() => {
  const m = nutritionStore.macros
  if (!m) return null
  if (m.profile_completion_required) {
    return { kind: 'incomplete' as const, missing: m.missing_fields }
  }
  return { kind: 'complete' as const, tdee: m.tdee, macros: m.macros }
})

function toggleInList(list: string[], value: string) {
  const idx = list.indexOf(value)
  if (idx >= 0) {
    list.splice(idx, 1)
  } else {
    list.push(value)
  }
}

function toNumberOrNull(value: string): number | null {
  if (value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

async function submitGoals() {
  goalsSubmitting.value = true
  goalsRateLimit.value = null
  await nutritionStore.updateGoals({
    health_goal: goalsForm.health_goal,
    calories_target: toNumberOrNull(goalsForm.calories_target),
    protein_g: toNumberOrNull(goalsForm.protein_g),
    carbs_g: toNumberOrNull(goalsForm.carbs_g),
    fat_g: toNumberOrNull(goalsForm.fat_g),
    allergies: [...goalsForm.allergies],
    diet_type: goalsForm.diet_type,
    gender: goalsForm.gender ? goalsForm.gender : null,
    age: toNumberOrNull(goalsForm.age),
    weight_kg: toNumberOrNull(goalsForm.weight_kg),
    height_cm: toNumberOrNull(goalsForm.height_cm),
    activity_level: goalsForm.activity_level ? goalsForm.activity_level : null,
  })
  if (!nutritionStore.error) {
    await nutritionStore.fetchMacros(true)
  }
  goalsSubmitting.value = false
}

async function submitFitness() {
  fitnessSubmitting.value = true
  fitnessRateLimit.value = null
  await fitnessStore.updateProfile({
    health_goal_fitness: fitnessForm.health_goal_fitness,
    experience_level: fitnessForm.experience_level,
    equipment: [...fitnessForm.equipment],
    limitations: [...fitnessForm.limitations],
    preferences: {
      duration_min_per_session: Number(fitnessForm.duration_min_per_session) || 45,
      sessions_per_week: Number(fitnessForm.sessions_per_week) || 3,
    },
  })
  fitnessSubmitting.value = false
}

function formatMissingField(field: string): string {
  const labels: Record<string, string> = {
    weight_kg: 'Poids (kg)',
    height_cm: 'Taille (cm)',
    age: 'Âge',
    gender: 'Genre',
    activity_level: 'Niveau d\'activité',
  }
  return labels[field] ?? field
}

onMounted(() => {
  void nutritionStore.fetchGoals()
  void nutritionStore.fetchMacros()
  void fitnessStore.fetchProfile()
})
</script>

<template>
  <UserLayout eyebrow="Espace personnel" title="Profil & objectifs">
    <div class="profile-grid">
      <!-- Section 1 : Objectifs nutritionnels -->
      <AppCard eyebrow="01 · Nutrition" title="Objectifs nutritionnels">
        <RateLimitBanner
          v-if="goalsRateLimit"
          data-testid="goals-rate-limit"
          :retry-after="goalsRateLimit"
          @dismiss="goalsRateLimit = null"
        />
        <p
          v-else-if="nutritionStore.error"
          role="alert"
          data-testid="goals-error"
          class="error-banner"
        >
          <strong>Erreur</strong>
          {{ nutritionStore.error.status >= 500
            ? 'Service nutrition indisponible. Réessaye dans un instant.'
            : nutritionStore.error.status === 401
              ? 'Session expirée. Reconnecte-toi.'
              : 'Impossible de charger les objectifs nutritionnels.' }}
        </p>

        <form data-testid="goals-form" class="form-stack" @submit.prevent="submitGoals">
          <div data-testid="goals-health-goal">
            <AppSelect
              v-model="goalsForm.health_goal"
              label="Objectif santé"
              :options="HEALTH_GOAL_OPTIONS"
            />
          </div>

          <div class="grid-2">
            <div data-testid="goals-calories">
              <AppInput
                v-model="goalsForm.calories_target"
                label="Calories cibles (kcal/jour)"
                type="number"
              />
            </div>
            <div data-testid="goals-protein">
              <AppInput v-model="goalsForm.protein_g" label="Protéines (g)" type="number" />
            </div>
            <div data-testid="goals-carbs">
              <AppInput v-model="goalsForm.carbs_g" label="Glucides (g)" type="number" />
            </div>
            <div data-testid="goals-fat">
              <AppInput v-model="goalsForm.fat_g" label="Lipides (g)" type="number" />
            </div>
          </div>

          <fieldset class="chips-field">
            <legend class="chips-field__legend">Allergies</legend>
            <div class="chips-field__list" data-testid="goals-allergies">
              <AppChip
                v-for="opt in ALLERGY_OPTIONS"
                :key="opt.value"
                :selected="goalsForm.allergies.includes(opt.value)"
                @toggle="toggleInList(goalsForm.allergies, opt.value)"
              >
                {{ opt.label }}
              </AppChip>
            </div>
          </fieldset>

          <div data-testid="goals-diet-type">
            <AppSelect
              v-model="goalsForm.diet_type"
              label="Régime alimentaire"
              :options="DIET_TYPE_OPTIONS"
            />
          </div>

          <fieldset class="bio-fieldset">
            <legend class="bio-fieldset__legend">Biométrie (pour le calcul TDEE)</legend>
            <div class="grid-2">
              <div data-testid="goals-gender">
                <AppSelect
                  v-model="goalsForm.gender"
                  label="Genre"
                  :options="GENDER_OPTIONS"
                />
              </div>
              <div data-testid="goals-age">
                <AppInput v-model="goalsForm.age" label="Âge" type="number" />
              </div>
              <div data-testid="goals-weight">
                <AppInput v-model="goalsForm.weight_kg" label="Poids (kg)" type="number" />
              </div>
              <div data-testid="goals-height">
                <AppInput v-model="goalsForm.height_cm" label="Taille (cm)" type="number" />
              </div>
            </div>
            <div data-testid="goals-activity-level">
              <AppSelect
                v-model="goalsForm.activity_level"
                label="Niveau d'activité"
                :options="ACTIVITY_LEVEL_OPTIONS"
              />
            </div>
          </fieldset>

          <div class="form-actions">
            <AppButton type="submit" :loading="goalsSubmitting || nutritionStore.loading">
              Enregistrer les objectifs
            </AppButton>
          </div>
        </form>
      </AppCard>

      <!-- Section 2 : Macros calculées (TDEE) -->
      <AppCard
        eyebrow="02 · TDEE"
        title="Macros calculées"
        data-testid="macros-section"
      >
        <RateLimitBanner
          v-if="macrosRateLimit"
          data-testid="macros-rate-limit"
          :retry-after="macrosRateLimit"
          @dismiss="macrosRateLimit = null"
        />
        <p
          v-else-if="nutritionStore.macrosError"
          role="alert"
          data-testid="macros-error"
          class="error-banner"
        >
          <strong>Erreur</strong>
          {{ nutritionStore.macrosError.status >= 500
            ? 'Service nutrition indisponible. Réessaye dans un instant.'
            : nutritionStore.macrosError.status === 401
              ? 'Session expirée. Reconnecte-toi.'
              : 'Impossible de calculer les macros.' }}
        </p>

        <EmptyState
          v-else-if="macrosState?.kind === 'incomplete'"
          icon="✦"
          title="Encore quelques infos"
          message="Renseigne ta biométrie (genre, âge, poids, taille, niveau d'activité) ci-dessus pour activer le calcul du TDEE."
        >
          <template #action>
            <ul class="missing-pills" data-testid="macros-missing" aria-label="Champs à compléter">
              <li v-for="field in macrosState.missing" :key="field" class="missing-pills__item">
                {{ formatMissingField(field) }}
              </li>
            </ul>
          </template>
        </EmptyState>

        <div v-else-if="macrosState?.kind === 'complete'" class="macros-grid">
          <div class="macros-cell macros-cell--tdee">
            <p class="macros-cell__label">TDEE</p>
            <p class="macros-cell__value">{{ Math.round(macrosState.tdee ?? 0) }}<span class="macros-cell__unit">kcal</span></p>
          </div>
          <div class="macros-cell">
            <p class="macros-cell__label">Calories</p>
            <p class="macros-cell__value">{{ Math.round(macrosState.macros?.calories ?? 0) }}<span class="macros-cell__unit">kcal</span></p>
          </div>
          <div class="macros-cell">
            <p class="macros-cell__label">Protéines</p>
            <p class="macros-cell__value">{{ Math.round(macrosState.macros?.protein_g ?? 0) }}<span class="macros-cell__unit">g</span></p>
          </div>
          <div class="macros-cell">
            <p class="macros-cell__label">Glucides</p>
            <p class="macros-cell__value">{{ Math.round(macrosState.macros?.carbs_g ?? 0) }}<span class="macros-cell__unit">g</span></p>
          </div>
          <div class="macros-cell">
            <p class="macros-cell__label">Lipides</p>
            <p class="macros-cell__value">{{ Math.round(macrosState.macros?.fat_g ?? 0) }}<span class="macros-cell__unit">g</span></p>
          </div>
        </div>

        <p v-else class="macros-placeholder">Chargement des macros…</p>
      </AppCard>

      <!-- Section 3 : Profil fitness -->
      <AppCard eyebrow="03 · Fitness" title="Profil fitness">
        <RateLimitBanner
          v-if="fitnessRateLimit"
          data-testid="fitness-rate-limit"
          :retry-after="fitnessRateLimit"
          @dismiss="fitnessRateLimit = null"
        />
        <p
          v-else-if="fitnessStore.error"
          role="alert"
          data-testid="fitness-error"
          class="error-banner"
        >
          <strong>Erreur</strong>
          {{ fitnessStore.error.status >= 500
            ? 'Service fitness indisponible. Réessaye dans un instant.'
            : fitnessStore.error.status === 401
              ? 'Session expirée. Reconnecte-toi.'
              : 'Impossible de charger le profil fitness.' }}
        </p>

        <form data-testid="fitness-form" class="form-stack" @submit.prevent="submitFitness">
          <div data-testid="fitness-goal">
            <AppSelect
              v-model="fitnessForm.health_goal_fitness"
              label="Objectif fitness"
              :options="FITNESS_GOAL_OPTIONS"
            />
          </div>

          <div data-testid="fitness-level">
            <AppSelect
              v-model="fitnessForm.experience_level"
              label="Niveau"
              :options="EXPERIENCE_LEVEL_OPTIONS"
            />
          </div>

          <fieldset class="chips-field">
            <legend class="chips-field__legend">Équipement disponible</legend>
            <div class="chips-field__list" data-testid="fitness-equipment">
              <AppChip
                v-for="opt in EQUIPMENT_OPTIONS"
                :key="opt.value"
                :selected="fitnessForm.equipment.includes(opt.value)"
                @toggle="toggleInList(fitnessForm.equipment, opt.value)"
              >
                {{ opt.label }}
              </AppChip>
            </div>
          </fieldset>

          <fieldset class="chips-field">
            <legend class="chips-field__legend">Limitations / blessures</legend>
            <div class="chips-field__list" data-testid="fitness-limitations">
              <AppChip
                v-for="opt in LIMITATION_OPTIONS"
                :key="opt.value"
                :selected="fitnessForm.limitations.includes(opt.value)"
                @toggle="toggleInList(fitnessForm.limitations, opt.value)"
              >
                {{ opt.label }}
              </AppChip>
            </div>
          </fieldset>

          <div class="grid-2">
            <div data-testid="fitness-duration">
              <AppInput
                v-model="fitnessForm.duration_min_per_session"
                label="Durée par séance (min)"
                type="number"
              />
            </div>
            <div data-testid="fitness-sessions">
              <AppInput
                v-model="fitnessForm.sessions_per_week"
                label="Séances par semaine"
                type="number"
              />
            </div>
          </div>

          <div class="form-actions">
            <AppButton type="submit" :loading="fitnessSubmitting || fitnessStore.loading">
              Enregistrer le profil fitness
            </AppButton>
          </div>
        </form>
      </AppCard>
    </div>
  </UserLayout>
</template>

<style scoped>
.profile-grid {
  display: grid;
  gap: var(--sp-lg);
  grid-template-columns: 1fr;
  max-width: 920px;
}

.form-stack {
  display: flex;
  flex-direction: column;
  gap: var(--sp-md);
}

.grid-2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--sp-md);
}

@media (max-width: 640px) {
  .grid-2 {
    grid-template-columns: 1fr;
  }
}

.chips-field {
  border: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--sp-sm);
}

.bio-fieldset {
  border: 1px solid rgba(20, 20, 20, 0.08);
  border-radius: var(--r-md);
  padding: var(--sp-md) var(--sp-lg) var(--sp-lg);
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--sp-md);
  background: rgba(255, 255, 255, 0.4);
}

.bio-fieldset__legend {
  padding: 0 var(--sp-xs);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--c-gray-600);
}

.chips-field__legend {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--c-gray-800);
  padding: 0;
}

.chips-field__list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-xs);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--sp-sm);
}

.error-banner {
  margin: 0 0 var(--sp-md);
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

.macros-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: var(--sp-md);
}

.macros-cell {
  padding: var(--sp-md);
  background: var(--c-cream-2, #f5efe9);
  border-radius: var(--r-md);
  border: 1px solid rgba(20, 20, 20, 0.04);
  display: flex;
  flex-direction: column;
  gap: var(--sp-xs);
}

.macros-cell--tdee {
  background: var(--c-acid);
  border-color: transparent;
}

.macros-cell__label {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: var(--c-gray-800);
}

.macros-cell__value {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.85rem;
  font-weight: 500;
  letter-spacing: -0.015em;
  color: var(--c-onyx);
  line-height: 1.1;
}

.macros-cell__unit {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  margin-left: 0.3rem;
  color: var(--c-gray-600);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.macros-placeholder {
  margin: 0;
  color: var(--c-gray-600);
  font-size: 0.875rem;
  font-style: italic;
}

.missing-pills {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-xs);
  justify-content: center;
}

.missing-pills__item {
  padding: 0.4rem 0.85rem;
  background: var(--c-onyx);
  color: var(--c-cream);
  border-radius: var(--r-pill);
  font-size: 0.8125rem;
  font-weight: 500;
}
</style>
