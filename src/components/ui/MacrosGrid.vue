<script setup lang="ts">
import { computed } from 'vue'

interface MacrosShape {
  calories?: number | null
  protein_g?: number | null
  carbs_g?: number | null
  fat_g?: number | null
  fiber_g?: number | null
}

const props = defineProps<{
  macros: MacrosShape | null
}>()

function format(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return String(Math.round(value))
}

const cells = computed(() => [
  {
    id: 'calories',
    label: 'Calories',
    unit: 'kcal',
    value: format(props.macros?.calories ?? null),
    accent: true,
  },
  {
    id: 'protein',
    label: 'Protéines',
    unit: 'g',
    value: format(props.macros?.protein_g ?? null),
  },
  {
    id: 'carbs',
    label: 'Glucides',
    unit: 'g',
    value: format(props.macros?.carbs_g ?? null),
  },
  {
    id: 'fat',
    label: 'Lipides',
    unit: 'g',
    value: format(props.macros?.fat_g ?? null),
  },
  {
    id: 'fiber',
    label: 'Fibres',
    unit: 'g',
    value: format(props.macros?.fiber_g ?? null),
  },
])
</script>

<template>
  <div class="macros-grid" role="list">
    <div
      v-for="cell in cells"
      :key="cell.id"
      :data-testid="`macros-${cell.id}`"
      :data-accent="cell.accent ? 'true' : 'false'"
      role="listitem"
      class="macros-cell"
    >
      <p class="macros-cell__label">{{ cell.label }}</p>
      <p class="macros-cell__value">
        <span class="macros-cell__number">{{ cell.value }}</span>
        <span class="macros-cell__unit">{{ cell.unit }}</span>
      </p>
    </div>
  </div>
</template>

<style scoped>
.macros-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: var(--sp-sm);
}

.macros-cell {
  display: flex;
  flex-direction: column;
  gap: var(--sp-xs);
  padding: var(--sp-md);
  border-radius: var(--r-md);
  background: #ffffff;
  border: 1px solid rgba(20, 20, 20, 0.06);
  box-shadow: var(--shadow-soft);
}

.macros-cell[data-accent='true'] {
  background: var(--c-onyx);
  color: var(--c-cream);
  border-color: transparent;
}

.macros-cell__label {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 0.625rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--c-gray-600);
}

.macros-cell[data-accent='true'] .macros-cell__label {
  color: var(--c-acid);
}

.macros-cell__value {
  margin: 0;
  display: flex;
  align-items: baseline;
  gap: var(--sp-xs);
  font-family: var(--font-display);
}

.macros-cell__number {
  font-size: 1.8rem;
  font-weight: 500;
  letter-spacing: -0.015em;
  line-height: 1;
}

.macros-cell__unit {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--c-gray-600);
}

.macros-cell[data-accent='true'] .macros-cell__unit {
  color: rgba(245, 240, 235, 0.6);
}

@media (max-width: 768px) {
  .macros-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
