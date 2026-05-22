<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import UserLayout from '@/layouts/UserLayout.vue'
import AppButton from '@/components/ui/AppButton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import MealCalendar from '@/components/MealCalendar.vue'
import { useMealPlanStore } from '@/stores/mealPlan'
import type { MealPlanSummary } from '@/services/aiNutritionApi'

const PAGE_SIZE = 10

const HEALTH_GOAL_LABELS: Record<string, string> = {
  weight_loss: 'Perte de poids',
  muscle_gain: 'Prise de masse',
  balance: 'Équilibre',
  sport_performance: 'Performance sportive',
}

const DIET_TYPE_LABELS: Record<string, string> = {
  omnivore: 'Omnivore',
  vegetarien: 'Végétarien',
  vegan: 'Vegan',
  sans_gluten: 'Sans gluten',
}

const DATE_FORMATTER = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

const store = useMealPlanStore()
const selectedPlan = ref<MealPlanSummary | null>(null)

const hasMore = computed(() => store.history.length < store.historyTotal)

const isEmpty = computed(
  () => !store.historyLoading && store.history.length === 0 && store.historyTotal === 0,
)

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return DATE_FORMATTER.format(d)
}

function formatBudget(value: number): string {
  return value.toFixed(2).replace(/\.?0+$/, '')
}

function healthGoalLabel(goal: string | null): string {
  if (!goal) return 'Sans objectif'
  return HEALTH_GOAL_LABELS[goal] ?? goal
}

function dietTypeLabel(diet: string): string {
  return DIET_TYPE_LABELS[diet] ?? diet
}

function openDetail(plan: MealPlanSummary) {
  selectedPlan.value = plan
}

function closeDetail() {
  selectedPlan.value = null
}

async function loadMore() {
  if (!hasMore.value) return
  await store.loadHistory(PAGE_SIZE, store.history.length)
}

onMounted(() => {
  void store.loadHistory(PAGE_SIZE, 0)
})
</script>

<template>
  <UserLayout eyebrow="IA · Nutrition" title="Historique plans repas">
    <div class="history">
      <EmptyState
        v-if="isEmpty"
        data-testid="meal-plan-history-empty"
        icon="◑"
        title="Aucun plan repas généré pour le moment"
        message="Lance ta première génération de plan repas pour le retrouver ici."
      >
        <template #action>
          <RouterLink to="/meal-plan" class="history__cta">
            Générer un plan →
          </RouterLink>
        </template>
      </EmptyState>

      <template v-else>
        <p
          v-if="store.historyTotal > 0"
          data-testid="meal-plan-history-counter"
          class="history__counter"
        >
          {{ store.history.length }} sur {{ store.historyTotal }}
        </p>

        <ul class="history__grid">
          <li v-for="plan in store.history" :key="plan.id" class="history__item">
            <button
              type="button"
              class="history__card"
              data-testid="meal-plan-history-card"
              @click="openDetail(plan)"
            >
              <header class="history__card-head">
                <p class="history__card-eyebrow">{{ formatDate(plan.created_at) }}</p>
                <h3 class="history__card-title">{{ healthGoalLabel(plan.health_goal) }}</h3>
              </header>
              <dl class="history__card-meta">
                <div class="history__card-meta-item">
                  <dt>Régime</dt>
                  <dd>{{ dietTypeLabel(plan.diet_type) }}</dd>
                </div>
                <div class="history__card-meta-item">
                  <dt>Durée</dt>
                  <dd>{{ plan.duration_days }} j</dd>
                </div>
                <div class="history__card-meta-item">
                  <dt>Budget</dt>
                  <dd>{{ formatBudget(plan.total_budget_eur) }} €</dd>
                </div>
              </dl>
            </button>
          </li>
        </ul>

        <div v-if="hasMore" class="history__footer">
          <AppButton
            variant="outline"
            data-testid="meal-plan-history-more"
            :loading="store.historyLoading"
            @click="loadMore"
          >
            Charger plus
          </AppButton>
        </div>
      </template>

      <section
        v-if="selectedPlan"
        class="history__detail"
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-detail-title"
        data-testid="meal-plan-history-detail"
      >
        <div class="history__detail-panel">
          <header class="history__detail-head">
            <div>
              <p class="history__detail-eyebrow">{{ formatDate(selectedPlan.created_at) }}</p>
              <h2 id="history-detail-title" class="history__detail-title">
                {{ healthGoalLabel(selectedPlan.health_goal) }} ·
                {{ dietTypeLabel(selectedPlan.diet_type) }}
              </h2>
            </div>
            <button
              type="button"
              class="history__detail-close"
              aria-label="Fermer le détail du plan"
              data-testid="meal-plan-history-detail-close"
              @click="closeDetail"
            >×</button>
          </header>

          <MealCalendar :days="selectedPlan.days" />

          <footer class="history__detail-footer">
            <p>
              <span class="history__detail-label">Durée</span>
              <span class="history__detail-value">{{ selectedPlan.duration_days }} jours</span>
            </p>
            <p>
              <span class="history__detail-label">Budget total estimé</span>
              <span class="history__detail-value">{{ formatBudget(selectedPlan.total_budget_eur) }} €</span>
            </p>
          </footer>
        </div>
      </section>
    </div>
  </UserLayout>
</template>

<style scoped>
.history {
  display: flex;
  flex-direction: column;
  gap: var(--sp-lg);
  max-width: 1100px;
}

.history__cta {
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

.history__cta:hover {
  background: var(--c-onyx-2);
}

.history__counter {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--c-gray-600);
}

.history__grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: var(--sp-md);
  grid-template-columns: 1fr;
}

@media (min-width: 720px) {
  .history__grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1100px) {
  .history__grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.history__item {
  display: flex;
}

.history__card {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--sp-md);
  background: #ffffff;
  border-radius: var(--r-lg);
  padding: var(--sp-lg);
  border: 1px solid rgba(20, 20, 20, 0.05);
  box-shadow: var(--shadow-soft);
  cursor: pointer;
  text-align: left;
  font-family: var(--font-body);
  color: var(--c-onyx);
  transition: transform var(--d-standard) var(--ease-out-expo),
    box-shadow var(--d-standard) var(--ease-out-expo);
}

.history__card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lift);
}

.history__card:focus-visible {
  outline: 2px solid var(--c-acid-dark);
  outline-offset: 4px;
}

.history__card-head {
  display: flex;
  flex-direction: column;
  gap: var(--sp-xs);
}

.history__card-eyebrow {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--c-gray-600);
}

.history__card-title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.35rem;
  font-weight: 500;
  letter-spacing: -0.01em;
}

.history__card-meta {
  margin: 0;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--sp-sm);
}

.history__card-meta-item {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.history__card-meta-item dt {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--c-gray-600);
  margin: 0;
}

.history__card-meta-item dd {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1rem;
  color: var(--c-onyx);
  font-weight: 500;
}

.history__footer {
  display: flex;
  justify-content: center;
  padding-top: var(--sp-sm);
}

.history__detail {
  position: fixed;
  inset: 0;
  background: rgba(20, 20, 20, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--sp-lg);
  z-index: 200;
  backdrop-filter: blur(3px);
}

.history__detail-panel {
  background: var(--c-cream);
  border-radius: var(--r-lg);
  padding: var(--sp-lg);
  max-width: 1100px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--sp-md);
  box-shadow: 0 24px 64px rgba(20, 20, 20, 0.30);
}

.history__detail-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--sp-md);
}

.history__detail-eyebrow {
  margin: 0 0 var(--sp-xs);
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--c-gray-600);
}

.history__detail-title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.6rem;
  font-weight: 500;
  letter-spacing: -0.01em;
  color: var(--c-onyx);
}

.history__detail-close {
  width: 40px;
  height: 40px;
  border-radius: var(--r-pill);
  border: 1px solid rgba(20, 20, 20, 0.12);
  background: transparent;
  cursor: pointer;
  font-size: 1.2rem;
  font-family: var(--font-mono);
  color: var(--c-onyx);
}

.history__detail-close:hover {
  background: var(--c-onyx);
  color: var(--c-acid);
}

.history__detail-footer {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-lg);
  padding: var(--sp-md) var(--sp-lg);
  background: #ffffff;
  border-radius: var(--r-md);
  border: 1px solid rgba(20, 20, 20, 0.06);
}

.history__detail-footer p {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.history__detail-label {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--c-gray-600);
}

.history__detail-value {
  font-family: var(--font-display);
  font-size: 1.15rem;
  font-weight: 500;
  color: var(--c-onyx);
}
</style>
