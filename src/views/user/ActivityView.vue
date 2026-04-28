<script setup lang="ts">
import { onMounted } from 'vue'
import MetricsCard from '@/components/common/MetricsCard.vue'
import { useActivityStore } from '@/stores/activity'

const activityStore = useActivityStore()

onMounted(async () => {
  if (!activityStore.summary) {
    await activityStore.fetchActivitySummary()
  }
})
</script>

<template>
  <section class="page">
    <header class="page-header">
      <h1 class="page-title">Activité</h1>
      <p class="page-subtitle">Suivi pas quotidiens, séances et calories brûlées.</p>
    </header>

    <p v-if="activityStore.error" class="alert alert-error" role="alert">{{ activityStore.error }}</p>

    <section v-if="activityStore.summary" class="metrics-grid">
      <MetricsCard title="Pas" :value="activityStore.summary.steps" variant="info" />
      <MetricsCard title="Progression pas" :value="activityStore.stepsProgress" :is-percentage="true" variant="success" />
      <MetricsCard title="Minutes actives" :value="activityStore.summary.activeMinutes" variant="warning" />
      <MetricsCard title="Calories brûlées" :value="activityStore.summary.caloriesBurned" variant="default" />
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
