<script setup lang="ts">
import type { DayPlan, Meal } from '@/services/aiNutritionApi'

defineProps<{
  days: DayPlan[]
}>()

const SLOT_LABELS = ['Petit-déjeuner', 'Déjeuner', 'Dîner', 'Encas', 'Collation']
const SLOT_TESTIDS = ['meal-breakfast', 'meal-lunch', 'meal-dinner', 'meal-snack', 'meal-extra']

function labelFor(index: number): string {
  return SLOT_LABELS[index] ?? `Repas ${index + 1}`
}

function testidFor(index: number): string {
  return SLOT_TESTIDS[index] ?? `meal-${index}`
}

function mealMacros(meal: Meal | undefined) {
  return meal?.macros ?? { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
}

function formatBudget(value: number | null | undefined): string {
  return (value ?? 0).toFixed(2).replace(/\.?0+$/, '')
}
</script>

<template>
  <div class="meal-calendar">
    <div data-testid="meal-calendar-grid" class="meal-calendar__grid">
      <article
        v-for="day in days"
        :key="day.day"
        data-testid="meal-day"
        class="meal-day"
      >
        <header class="meal-day__head">
          <p class="meal-day__eyebrow">Programme</p>
          <h3 class="meal-day__title">Jour {{ day.day }}</h3>
        </header>

        <ul class="meal-day__slots">
          <li
            v-for="(meal, idx) in day.meals"
            :key="idx"
            :data-testid="testidFor(idx)"
            class="meal-slot"
          >
            <p class="meal-slot__label">{{ labelFor(idx) }}</p>
            <p class="meal-slot__name">{{ meal.name }}</p>

            <ul class="meal-slot__macros" aria-label="Macronutriments">
              <li>
                <span class="meal-slot__macro-key">kcal</span>
                <span class="meal-slot__macro-val">{{ Math.round(mealMacros(meal).calories ?? 0) }}</span>
              </li>
              <li>
                <span class="meal-slot__macro-key">P</span>
                <span class="meal-slot__macro-val">{{ Math.round(mealMacros(meal).protein_g ?? 0) }}g</span>
              </li>
              <li>
                <span class="meal-slot__macro-key">G</span>
                <span class="meal-slot__macro-val">{{ Math.round(mealMacros(meal).carbs_g ?? 0) }}g</span>
              </li>
              <li>
                <span class="meal-slot__macro-key">L</span>
                <span class="meal-slot__macro-val">{{ Math.round(mealMacros(meal).fat_g ?? 0) }}g</span>
              </li>
            </ul>

            <ul class="meal-slot__ingredients" aria-label="Ingrédients">
              <li
                v-for="ingredient in meal.ingredients"
                :key="ingredient"
              >{{ ingredient }}</li>
            </ul>

            <p class="meal-slot__meta">
              <span class="meal-slot__meta-budget">{{ formatBudget(meal.est_budget_eur) }} €</span>
              <span class="meal-slot__meta-sep" aria-hidden="true">·</span>
              <span class="meal-slot__meta-prep">{{ meal.prep_time_min }} min</span>
            </p>
          </li>
        </ul>
      </article>
    </div>
  </div>
</template>

<style scoped>
.meal-calendar {
  display: flex;
  flex-direction: column;
  gap: var(--sp-lg);
  font-family: var(--font-body);
}

.meal-calendar__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--sp-md);
}

.meal-day {
  background: #ffffff;
  border-radius: var(--r-lg);
  padding: var(--sp-lg);
  border: 1px solid rgba(20, 20, 20, 0.05);
  box-shadow: var(--shadow-soft);
  display: flex;
  flex-direction: column;
  gap: var(--sp-md);
}

.meal-day__head {
  display: flex;
  flex-direction: column;
  gap: var(--sp-xs);
  border-bottom: 1px solid rgba(20, 20, 20, 0.06);
  padding-bottom: var(--sp-sm);
}

.meal-day__eyebrow {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--c-gray-600);
}

.meal-day__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 500;
  letter-spacing: -0.01em;
  color: var(--c-onyx);
}

.meal-day__slots {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--sp-md);
}

.meal-slot {
  display: flex;
  flex-direction: column;
  gap: var(--sp-xs);
  padding: var(--sp-md);
  background: var(--c-cream-2);
  border-radius: var(--r-md);
}

.meal-slot__label {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 0.625rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--c-gray-600);
}

.meal-slot__name {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.1rem;
  font-weight: 500;
  color: var(--c-onyx);
  letter-spacing: -0.005em;
}

.meal-slot__macros {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-sm);
}

.meal-slot__macros li {
  display: inline-flex;
  align-items: baseline;
  gap: 0.25rem;
  font-family: var(--font-mono);
  font-size: 0.75rem;
}

.meal-slot__macro-key {
  color: var(--c-gray-600);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.meal-slot__macro-val {
  color: var(--c-onyx);
  font-weight: 600;
}

.meal-slot__ingredients {
  list-style: disc inside;
  margin: 0;
  padding: 0;
  font-size: 0.8125rem;
  color: var(--c-gray-800);
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem 0.75rem;
}

.meal-slot__ingredients li {
  display: inline;
}

.meal-slot__meta {
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: var(--sp-xs);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--c-gray-800);
}

.meal-slot__meta-budget {
  color: var(--c-onyx);
  font-weight: 600;
}

.meal-slot__meta-sep {
  color: var(--c-gray-400);
}

@media (min-width: 768px) {
  .meal-calendar__grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1100px) {
  .meal-calendar__grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
