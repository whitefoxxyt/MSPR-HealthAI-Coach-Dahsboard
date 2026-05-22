<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import UserLayout from '@/layouts/UserLayout.vue'
import AIInsightCard from '@/components/ui/AIInsightCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import MacrosGrid from '@/components/ui/MacrosGrid.vue'
import { useMealAnalysisStore } from '@/stores/mealAnalysis'
import type { MealAnalysisHistoryItem } from '@/services/aiNutritionApi'

const PAGE_SIZE = 10
const PREVIEW_FOODS = 3
const NETWORK_ERROR_STATUS = 0

const store = useMealAnalysisStore()
const selected = ref<MealAnalysisHistoryItem | null>(null)
const showSkeleton = ref(false)

onMounted(() => {
  showSkeleton.value = store.history.length === 0
  store.loadHistory(PAGE_SIZE, 0)
})

watch(
  () => store.historyLoading,
  (next) => {
    if (!next) showSkeleton.value = false
  },
)

const initialLoading = computed(
  () => showSkeleton.value && store.historyLoading && store.history.length === 0,
)

const showEmpty = computed(
  () =>
    !store.historyLoading &&
    !store.historyError &&
    store.history.length === 0 &&
    !initialLoading.value,
)

const showLoadMore = computed(() => store.history.length < store.historyTotal)

const errorMessage = computed(() => {
  const err = store.historyError
  if (!err) return null
  if (err.status === NETWORK_ERROR_STATUS || err.status >= 500) {
    return 'Le service AI Nutrition est indisponible. Réessaie dans un instant.'
  }
  return `Impossible de charger l'historique (HTTP ${err.status}).`
})

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function previewFoods(item: MealAnalysisHistoryItem): string[] {
  return item.detected_foods.slice(0, PREVIEW_FOODS).map((f) => f.name)
}

function extraFoodsCount(item: MealAnalysisHistoryItem): number {
  return Math.max(0, item.detected_foods.length - PREVIEW_FOODS)
}

function openDetail(item: MealAnalysisHistoryItem) {
  selected.value = item
  document.body.style.overflow = 'hidden'
}

function closeDetail() {
  selected.value = null
  document.body.style.overflow = ''
}

function onLoadMore() {
  store.loadHistory(PAGE_SIZE, store.history.length)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && selected.value) closeDetail()
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <UserLayout eyebrow="IA · Vision" title="Historique des analyses.">
    <p class="lead">
      Retrouve toutes tes photos analysées, leurs aliments détectés et leurs macros.
    </p>

    <section
      v-if="initialLoading"
      data-testid="history-skeleton"
      class="skeleton-list"
      aria-busy="true"
      aria-live="polite"
    >
      <div v-for="i in 3" :key="i" class="skeleton-card" />
    </section>

    <p
      v-else-if="errorMessage"
      data-testid="history-error"
      class="error-banner"
      role="alert"
    >{{ errorMessage }}</p>

    <EmptyState
      v-else-if="showEmpty"
      data-testid="empty-state"
      title="Aucune analyse pour le moment."
      message="Lance ta première analyse de repas pour démarrer ton historique."
      icon="◐"
    >
      <template #action>
        <RouterLink
          data-testid="empty-cta"
          to="/meal-analysis"
          class="cta-link"
        >Faire une analyse</RouterLink>
      </template>
    </EmptyState>

    <template v-else>
      <header class="list-head">
        <p data-testid="history-counter" class="counter">
          {{ store.history.length }} sur {{ store.historyTotal }}
        </p>
      </header>

      <ul class="history-list" role="list">
        <li
          v-for="item in store.history"
          :key="item.id"
          data-testid="history-card"
          class="history-card"
          tabindex="0"
          role="button"
          :aria-label="`Voir l'analyse du ${formatDate(item.created_at)}`"
          @click="openDetail(item)"
          @keydown.enter.prevent="openDetail(item)"
          @keydown.space.prevent="openDetail(item)"
        >
          <div class="history-card__media">
            <img
              v-if="item.image_url"
              :src="item.image_url"
              :alt="`Repas ${item.meal_type ?? ''}`"
              class="history-card__image"
              loading="lazy"
              decoding="async"
            />
            <div v-else class="history-card__placeholder" aria-hidden="true">◐</div>
          </div>
          <div class="history-card__body">
            <p class="history-card__date">{{ formatDate(item.created_at) }}</p>
            <ul class="foods-preview" role="list">
              <li
                v-for="food in previewFoods(item)"
                :key="food"
                class="foods-preview__item"
              >{{ food }}</li>
              <li
                v-if="extraFoodsCount(item) > 0"
                class="foods-preview__more"
              >+{{ extraFoodsCount(item) }}</li>
            </ul>
            <p class="history-card__kcal">
              <span class="history-card__kcal-value">{{ Math.round(item.macros.calories) }}</span>
              <span class="history-card__kcal-unit">kcal</span>
            </p>
          </div>
        </li>
      </ul>

      <div v-if="showLoadMore" class="load-more-wrap">
        <AppButton
          data-testid="load-more"
          variant="outline"
          size="md"
          :loading="store.historyLoading"
          @click="onLoadMore"
        >Charger plus</AppButton>
      </div>
    </template>

    <Teleport to="body">
      <Transition name="detail-fade">
        <div
          v-if="selected"
          data-testid="detail-modal"
          class="detail-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="detail-title"
          @click.self="closeDetail"
        >
          <div class="detail-panel" tabindex="-1">
            <header class="detail-head">
              <div>
                <p class="detail-eyebrow">{{ formatDate(selected.created_at) }}</p>
                <h2 id="detail-title" class="detail-title">Détail de l'analyse</h2>
              </div>
              <button
                type="button"
                class="detail-close"
                aria-label="Fermer la fenêtre"
                @click="closeDetail"
              >×</button>
            </header>
            <div class="detail-body">
              <img
                v-if="selected.image_url"
                :src="selected.image_url"
                alt="Photo du repas analysé"
                class="detail-image"
                loading="lazy"
                decoding="async"
              />
              <section>
                <h3 class="detail-section-title">Aliments détectés</h3>
                <ul class="detail-foods" role="list">
                  <li
                    v-for="food in selected.detected_foods"
                    :key="food.name"
                    class="detail-foods__item"
                  >
                    <span>{{ food.name }}</span>
                    <span class="detail-foods__confidence">{{ Math.round(food.confidence * 100) }}%</span>
                  </li>
                </ul>
              </section>
              <section>
                <h3 class="detail-section-title">Macros estimées</h3>
                <MacrosGrid :macros="selected.macros" />
              </section>
              <AIInsightCard
                :text="selected.insight"
                :backend="selected.llm_backend_used"
              />
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </UserLayout>
</template>

<style scoped>
.lead {
  font-family: var(--font-display);
  font-size: clamp(1.1rem, 1.6vw, 1.4rem);
  line-height: 1.5;
  color: var(--c-gray-800);
  max-width: 56ch;
  margin: 0 0 var(--sp-xl);
}

.list-head {
  margin-bottom: var(--sp-lg);
}

.counter {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--c-gray-600);
}

.history-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--sp-lg);
  list-style: none;
  margin: 0 0 var(--sp-xl);
  padding: 0;
}

.history-card {
  display: flex;
  flex-direction: column;
  gap: var(--sp-md);
  background: #ffffff;
  border-radius: var(--r-lg);
  padding: var(--sp-md);
  border: 1px solid rgba(20, 20, 20, 0.04);
  box-shadow: var(--shadow-soft);
  cursor: pointer;
  text-align: left;
  transition:
    transform var(--d-standard) var(--ease-out-expo),
    box-shadow var(--d-standard) var(--ease-out-expo);
}

.history-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lift);
}

.history-card:focus-visible {
  outline: 2px solid var(--c-acid-dark);
  outline-offset: 3px;
}

.history-card__media {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 10;
  border-radius: var(--r-md);
  overflow: hidden;
  background: var(--c-cream-2);
}

.history-card__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.history-card__placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-mono);
  font-size: 2rem;
  color: var(--c-gray-400);
}

.history-card__body {
  display: flex;
  flex-direction: column;
  gap: var(--sp-sm);
}

.history-card__date {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--c-gray-600);
}

.foods-preview {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-xs);
  list-style: none;
  margin: 0;
  padding: 0;
}

.foods-preview__item,
.foods-preview__more {
  display: inline-flex;
  align-items: center;
  padding: 0.3rem 0.7rem;
  border-radius: var(--r-pill);
  background: var(--c-cream-2);
  color: var(--c-onyx);
  font-size: 0.8125rem;
  font-weight: 500;
}

.foods-preview__more {
  background: var(--c-onyx);
  color: var(--c-acid);
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  letter-spacing: 0.1em;
}

.history-card__kcal {
  margin: 0;
  display: flex;
  align-items: baseline;
  gap: var(--sp-xs);
  font-family: var(--font-display);
}

.history-card__kcal-value {
  font-size: 1.6rem;
  font-weight: 500;
  letter-spacing: -0.015em;
  color: var(--c-onyx);
}

.history-card__kcal-unit {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.12em;
  color: var(--c-gray-600);
}

.load-more-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: var(--sp-2xl);
}

.skeleton-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--sp-lg);
}

.skeleton-card {
  height: 280px;
  border-radius: var(--r-lg);
  background: linear-gradient(
    90deg,
    var(--c-cream-2) 0%,
    rgba(20, 20, 20, 0.04) 50%,
    var(--c-cream-2) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.4s linear infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton-card { animation: none; }
  .history-card { transition: none; }
}

.error-banner {
  margin: 0 0 var(--sp-lg);
  padding: var(--sp-md);
  background: rgba(255, 102, 99, 0.12);
  border: 1px solid var(--c-coral);
  border-radius: var(--r-md);
  font-size: 0.875rem;
  color: var(--c-onyx);
}

.cta-link {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-xs);
  padding: 0.7rem 1.35rem;
  background: var(--c-onyx);
  color: var(--c-cream);
  border-radius: var(--r-pill);
  font-weight: 600;
  text-decoration: none;
  font-size: 0.9375rem;
  letter-spacing: -0.005em;
  transition: background var(--d-standard) var(--ease-out-expo);
}

.cta-link:hover { background: var(--c-onyx-2); }
.cta-link:focus-visible {
  outline: 2px solid var(--c-acid-dark);
  outline-offset: 3px;
}

/* Detail modal */
.detail-backdrop {
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

.detail-panel {
  position: relative;
  width: 100%;
  max-width: 640px;
  max-height: min(92vh, 800px);
  display: flex;
  flex-direction: column;
  background: var(--c-cream);
  border-radius: var(--r-lg);
  box-shadow: 0 32px 64px rgba(20, 20, 20, 0.35);
  overflow: hidden;
  outline: none;
}

.detail-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: var(--sp-lg);
  border-bottom: 1px solid rgba(20, 20, 20, 0.06);
  background: #ffffff;
}

.detail-eyebrow {
  margin: 0 0 var(--sp-xs);
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--c-gray-600);
}

.detail-title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 500;
  letter-spacing: -0.01em;
  color: var(--c-onyx);
}

.detail-close {
  width: 36px;
  height: 36px;
  border-radius: var(--r-pill);
  border: 1px solid rgba(20, 20, 20, 0.10);
  background: transparent;
  color: var(--c-onyx);
  font-size: 1.4rem;
  line-height: 1;
  cursor: pointer;
  transition: background var(--d-standard) var(--ease-out-expo);
}

.detail-close:hover {
  background: var(--c-onyx);
  color: var(--c-acid);
}

.detail-close:focus-visible {
  outline: 2px solid var(--c-acid-dark);
  outline-offset: 2px;
}

.detail-body {
  padding: var(--sp-lg);
  display: flex;
  flex-direction: column;
  gap: var(--sp-lg);
  overflow-y: auto;
}

.detail-image {
  width: 100%;
  max-height: 320px;
  object-fit: cover;
  border-radius: var(--r-md);
}

.detail-section-title {
  margin: 0 0 var(--sp-sm);
  font-family: var(--font-display);
  font-size: 1.1rem;
  font-weight: 500;
  letter-spacing: -0.005em;
  color: var(--c-onyx);
}

.detail-foods {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--sp-xs);
}

.detail-foods__item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--sp-sm) var(--sp-md);
  background: var(--c-cream-2);
  border-radius: var(--r-md);
  font-size: 0.9375rem;
}

.detail-foods__confidence {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  color: var(--c-gray-600);
}

.detail-fade-enter-active,
.detail-fade-leave-active {
  transition: opacity 0.18s ease;
}

.detail-fade-enter-active .detail-panel,
.detail-fade-leave-active .detail-panel {
  transition: transform 0.18s ease;
}

.detail-fade-enter-from,
.detail-fade-leave-to { opacity: 0; }

.detail-fade-enter-from .detail-panel,
.detail-fade-leave-to .detail-panel {
  transform: translateY(8px);
}

@media (prefers-reduced-motion: reduce) {
  .detail-fade-enter-active,
  .detail-fade-leave-active,
  .detail-fade-enter-active .detail-panel,
  .detail-fade-leave-active .detail-panel {
    transition: none;
  }
}

@media (max-width: 640px) {
  .detail-panel { max-width: 100%; }
  .detail-head,
  .detail-body { padding: var(--sp-md); }
}
</style>
