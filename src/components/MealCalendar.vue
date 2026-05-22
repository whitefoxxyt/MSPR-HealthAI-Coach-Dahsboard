<script setup lang="ts">
import type { DayPlan, Meal } from '@/services/aiNutritionApi'

defineProps<{
  days: DayPlan[]
}>()

const MEAL_SLOTS: Array<{ key: 'breakfast' | 'lunch' | 'dinner'; label: string; testid: string }> = [
  { key: 'breakfast', label: 'Petit-déjeuner', testid: 'meal-breakfast' },
  { key: 'lunch', label: 'Déjeuner', testid: 'meal-lunch' },
  { key: 'dinner', label: 'Dîner', testid: 'meal-dinner' },
]

function mealOf(day: DayPlan, key: 'breakfast' | 'lunch' | 'dinner'): Meal {
  return day[key]
}

function formatBudget(value: number): string {
  return value.toFixed(2).replace(/\.?0+$/, '')
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
            v-for="slot in MEAL_SLOTS"
            :key="slot.key"
            :data-testid="slot.testid"
            class="meal-slot"
          >
            <p class="meal-slot__label">{{ slot.label }}</p>
            <p class="meal-slot__name">{{ mealOf(day, slot.key).name }}</p>

            <ul class="meal-slot__macros" aria-label="Macronutriments">
              <li>
                <span class="meal-slot__macro-key">kcal</span>
                <span class="meal-slot__macro-val">{{ Math.round(mealOf(day, slot.key).macros.calories) }}</span>
              </li>
              <li>
                <span class="meal-slot__macro-key">P</span>
                <span class="meal-slot__macro-val">{{ Math.round(mealOf(day, slot.key).macros.protein_g) }}g</span>
              </li>
              <li>
                <span class="meal-slot__macro-key">G</span>
                <span class="meal-slot__macro-val">{{ Math.round(mealOf(day, slot.key).macros.carbs_g) }}g</span>
              </li>
              <li>
                <span class="meal-slot__macro-key">L</span>
                <span class="meal-slot__macro-val">{{ Math.round(mealOf(day, slot.key).macros.fat_g) }}g</span>
              </li>
            </ul>

            <ul class="meal-slot__ingredients" aria-label="Ingrédients">
              <li
                v-for="ingredient in mealOf(day, slot.key).ingredients"
                :key="ingredient"
              >{{ ingredient }}</li>
            </ul>

            <p class="meal-slot__meta">
              <span class="meal-slot__meta-budget">{{ formatBudget(mealOf(day, slot.key).budget_eur) }} €</span>
              <span class="meal-slot__meta-sep" aria-hidden="true">·</span>
              <span class="meal-slot__meta-prep">{{ mealOf(day, slot.key).prep_time_min }} min</span>
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
