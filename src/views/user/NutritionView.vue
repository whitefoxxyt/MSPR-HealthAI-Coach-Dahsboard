<script setup lang="ts">
import { onMounted } from 'vue'
import MetricsCard from '@/components/common/MetricsCard.vue'
import { useNutritionStore } from '@/stores/nutrition'

const nutritionStore = useNutritionStore()

onMounted(async () => {
  if (!nutritionStore.summary) {
    await nutritionStore.fetchNutritionSummary()
  }
})
</script>

<template>
  <section class="page">
    <header class="page-header">
      <h1 class="page-title">Nutrition</h1>
      <p class="page-subtitle">Suivi calories, macros et hydratation.</p>
    </header>

    <p v-if="nutritionStore.error" class="alert alert-error" role="alert">{{ nutritionStore.error }}</p>

    <section v-if="nutritionStore.summary" class="metrics-grid">
      <MetricsCard title="Calories" :value="nutritionStore.summary.consumedCalories" variant="info" />
      <MetricsCard title="Objectif" :value="nutritionStore.summary.targetCalories" variant="default" />
      <MetricsCard title="Hydratation" :value="nutritionStore.hydrationProgress" :is-percentage="true" variant="success" />
      <MetricsCard title="Adhérence" :value="nutritionStore.summary.adherenceRate" :is-percentage="true" variant="warning" />
    </section>
  </section>
</template>

<style scoped>
.page {
  padding: 1rem;
}

.page-title {
  margin: 0;
}

.page-subtitle {
  margin: 0.35rem 0 1rem;
  color: #6b7280;
}

.metrics-grid {
  display: grid;
  gap: 0.75rem;
}

.alert {
  border-radius: 8px;
  padding: 0.75rem;
  margin-bottom: 1rem;
}

.alert-error {
  color: #991b1b;
  border: 1px solid #fecaca;
  background: #fef2f2;
}

@media (min-width: 900px) {
  .page {
    padding: 1.5rem 2rem;
  }
  .metrics-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
