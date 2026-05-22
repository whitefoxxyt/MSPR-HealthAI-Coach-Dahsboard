<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { RouterLink } from 'vue-router'
import UserLayout from '@/layouts/UserLayout.vue'
import AIInsightCard from '@/components/ui/AIInsightCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import FileDropzone, { type DropzoneError } from '@/components/ui/FileDropzone.vue'
import MacrosGrid from '@/components/ui/MacrosGrid.vue'
import RateLimitBanner from '@/components/ui/RateLimitBanner.vue'
import { useMealAnalysisStore } from '@/stores/mealAnalysis'
import type { MealType } from '@/services/aiNutritionApi'

const COOLDOWN_SECONDS = 60
const NETWORK_ERROR_STATUS = 0

const MEAL_TYPE_OPTIONS: Array<{ value: MealType; label: string }> = [
  { value: 'breakfast', label: 'Petit-déjeuner' },
  { value: 'lunch', label: 'Déjeuner' },
  { value: 'dinner', label: 'Dîner' },
  { value: 'snack', label: 'Encas' },
]

const store = useMealAnalysisStore()

const selectedFile = ref<File | null>(null)
const previewUrl = ref<string | null>(null)
const mealType = ref<MealType>('lunch')
const dropzoneError = ref<string | null>(null)
const cooldownRemaining = ref(0)
let cooldownTimer: ReturnType<typeof setInterval> | null = null

function clearPreview() {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = null
  }
}

function onFileSelected(file: File) {
  dropzoneError.value = null
  selectedFile.value = file
  clearPreview()
  previewUrl.value = URL.createObjectURL(file)
}

function onDropzoneError(err: DropzoneError) {
  dropzoneError.value = err.message
  selectedFile.value = null
  clearPreview()
}

function startCooldown() {
  cooldownRemaining.value = COOLDOWN_SECONDS
  stopCooldown()
  cooldownTimer = setInterval(() => {
    cooldownRemaining.value = Math.max(0, cooldownRemaining.value - 1)
    if (cooldownRemaining.value === 0) stopCooldown()
  }, 1000)
}

function stopCooldown() {
  if (cooldownTimer) {
    clearInterval(cooldownTimer)
    cooldownTimer = null
  }
}

async function onAnalyze() {
  if (!selectedFile.value || cooldownRemaining.value > 0 || store.loading) return
  const file = selectedFile.value
  startCooldown()
  await store.submitMeal(file, mealType.value)
}

function onReset() {
  store.reset()
  selectedFile.value = null
  dropzoneError.value = null
  clearPreview()
}

const canAnalyze = computed(
  () => !!selectedFile.value && !store.loading && cooldownRemaining.value === 0,
)

const errorMessage = computed(() => {
  const err = store.error
  if (!err) return null
  if (err.status === 429) return null
  if (err.status === NETWORK_ERROR_STATUS || err.status >= 500) {
    return 'Le service AI Nutrition est indisponible. Réessaie dans un instant.'
  }
  return `Impossible d'analyser ce repas (HTTP ${err.status}).`
})

const visibleDropzoneError = computed(() =>
  errorMessage.value ? null : dropzoneError.value,
)

const showResult = computed(
  () => !!store.analysis && !store.loading && !store.error,
)

const confidencePct = (n: number) => `${Math.round(n * 100)}%`

onBeforeUnmount(() => {
  stopCooldown()
  clearPreview()
})
</script>

<template>
  <UserLayout eyebrow="IA · Vision" title="Analyser un repas.">
    <RateLimitBanner
      v-if="store.retryAfter && store.error?.status === 429"
      data-testid="rate-limit"
      :retry-after="store.retryAfter"
    />

    <p class="lead">
      Prends une photo de ton assiette, choisis le moment du repas, et reçois
      tes macros estimées avec une suggestion personnalisée du coach IA.
    </p>

    <!-- Step 1: dropzone + meal_type -->
    <section v-if="!showResult && !store.loading" class="block">
      <header class="block__head">
        <p class="block__eyebrow">01 · Ta photo</p>
        <h2 class="block__title">Glisse ou choisis une image.</h2>
      </header>

      <div class="step-grid">
        <FileDropzone
          :preview-url="previewUrl"
          :disabled="store.loading"
          @file="onFileSelected"
          @error="onDropzoneError"
        />

        <div class="step-controls">
          <AppSelect
            v-model="mealType"
            data-testid="meal-type-select"
            label="Moment du repas"
            :options="MEAL_TYPE_OPTIONS"
            hint="Aide le coach IA à calibrer la portion."
          />

          <p
            v-if="visibleDropzoneError"
            data-testid="dropzone-error"
            class="error-banner"
            role="alert"
          >{{ visibleDropzoneError }}</p>

          <p
            v-if="errorMessage"
            data-testid="analysis-error"
            class="error-banner"
            role="alert"
          >{{ errorMessage }}</p>

          <p
            v-if="cooldownRemaining > 0"
            data-testid="cooldown"
            class="cooldown"
          >Pause anti-spam : encore {{ cooldownRemaining }} s avant la prochaine analyse.</p>

          <AppButton
            data-testid="analyze-button"
            variant="acid"
            size="lg"
            :disabled="!canAnalyze"
            :loading="store.loading"
            @click="onAnalyze"
          >Analyser le repas</AppButton>
        </div>
      </div>
    </section>

    <!-- Step 2: loading skeleton -->
    <section v-if="store.loading" data-testid="analysis-skeleton" class="skeleton">
      <div class="skeleton__row skeleton__row--lg" />
      <div class="skeleton__grid">
        <div v-for="i in 5" :key="i" class="skeleton__cell" />
      </div>
      <div class="skeleton__row" />
    </section>

    <!-- Step 3: result -->
    <section v-if="showResult && store.analysis" data-testid="analysis-result" class="result">
      <div class="result__head">
        <header class="block__head">
          <p class="block__eyebrow">02 · Résultat</p>
          <h2 class="block__title">Voici ce que l'IA a vu.</h2>
        </header>
        <div class="result__actions">
          <AppButton
            data-testid="reset-button"
            variant="outline"
            size="md"
            @click="onReset"
          >Nouvelle analyse</AppButton>
          <RouterLink
            data-testid="history-link"
            class="history-link"
            to="/meal-analyses"
          >Historique</RouterLink>
        </div>
      </div>

      <div class="result__grid">
        <AppCard variant="elevated" eyebrow="Photo analysée" title="">
          <img
            v-if="previewUrl"
            :src="previewUrl"
            alt="Photo du repas analysé"
            class="result__image"
          />
          <ul data-testid="detected-foods" class="foods">
            <li
              v-for="food in store.analysis.detected_foods"
              :key="food.name"
              class="foods__item"
            >
              <span class="foods__name">{{ food.name }}</span>
              <span class="foods__confidence">{{ confidencePct(food.confidence) }}</span>
            </li>
          </ul>
        </AppCard>

        <div class="result__macros">
          <header class="block__sub">
            <p class="block__eyebrow">Macros estimées</p>
          </header>
          <MacrosGrid :macros="store.analysis.macros" />
          <AIInsightCard
            :text="store.analysis.insight"
            :backend="store.analysis.llm_backend_used"
          />
        </div>
      </div>
    </section>
  </UserLayout>
</template>

<style scoped>
.lead {
  font-family: var(--font-display);
  font-size: clamp(1.1rem, 1.6vw, 1.4rem);
  line-height: 1.5;
  color: var(--c-gray-800);
  max-width: 56ch;
  margin: 0 0 var(--sp-2xl);
}

.block {
  display: flex;
  flex-direction: column;
  gap: var(--sp-lg);
  margin-bottom: var(--sp-2xl);
}

.block__head {
  display: flex;
  flex-direction: column;
  gap: var(--sp-xs);
}

.block__sub {
  margin-bottom: var(--sp-sm);
}

.block__eyebrow {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--c-gray-600);
}

.block__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(1.6rem, 2.6vw, 2.2rem);
  font-weight: 500;
  line-height: 1.1;
  letter-spacing: -0.015em;
  color: var(--c-onyx);
}

.step-grid {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: var(--sp-lg);
}

.step-controls {
  display: flex;
  flex-direction: column;
  gap: var(--sp-md);
}

.error-banner {
  margin: 0;
  padding: var(--sp-md);
  background: rgba(255, 102, 99, 0.12);
  border: 1px solid var(--c-coral);
  border-radius: var(--r-md);
  font-size: 0.875rem;
  color: var(--c-onyx);
}

.cooldown {
  margin: 0;
  padding: var(--sp-sm) var(--sp-md);
  background: var(--c-cream-2);
  border-radius: var(--r-md);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  color: var(--c-gray-800);
}

.skeleton {
  display: flex;
  flex-direction: column;
  gap: var(--sp-md);
}

.skeleton__row,
.skeleton__cell {
  background: linear-gradient(
    90deg,
    var(--c-cream-2) 0%,
    rgba(20, 20, 20, 0.04) 50%,
    var(--c-cream-2) 100%
  );
  background-size: 200% 100%;
  border-radius: var(--r-md);
  animation: shimmer 1.4s linear infinite;
}

.skeleton__row {
  height: 32px;
}

.skeleton__row--lg {
  height: 200px;
}

.skeleton__grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: var(--sp-sm);
}

.skeleton__cell {
  height: 90px;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.result {
  display: flex;
  flex-direction: column;
  gap: var(--sp-lg);
}

.result__head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: var(--sp-md);
  flex-wrap: wrap;
}

.result__actions {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-md);
}

.result__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-lg);
}

.result__macros {
  display: flex;
  flex-direction: column;
  gap: var(--sp-md);
}

.result__image {
  width: 100%;
  max-height: 280px;
  object-fit: cover;
  border-radius: var(--r-md);
  margin-bottom: var(--sp-md);
}

.foods {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--sp-xs);
}

.foods__item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--sp-sm) var(--sp-md);
  background: var(--c-cream-2);
  border-radius: var(--r-md);
  font-size: 0.9375rem;
}

.foods__confidence {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  color: var(--c-gray-600);
}

.history-link {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-xs);
  padding: 0.55rem 1.1rem;
  background: var(--c-onyx);
  color: var(--c-cream);
  border-radius: var(--r-pill);
  text-decoration: none;
  font-size: 0.8125rem;
  font-weight: 500;
}

.history-link:hover {
  background: var(--c-onyx-2);
}

.history-link:focus-visible {
  outline: 2px solid var(--c-acid-dark);
  outline-offset: 3px;
}

@media (max-width: 1024px) {
  .step-grid,
  .result__grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .skeleton__grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton__row,
  .skeleton__cell {
    animation: none;
  }
}
</style>
