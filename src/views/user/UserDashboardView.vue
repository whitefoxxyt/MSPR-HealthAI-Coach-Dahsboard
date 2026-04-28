<script setup lang="ts">
import { onMounted } from 'vue'
import MetricsCard from '@/components/common/MetricsCard.vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

onMounted(async () => {
  if (!userStore.metrics || !userStore.profile) {
    await userStore.hydrateDashboard()
  }
})
</script>

<template>
  <section class="page">
    <header class="page-header">
      <h1 class="page-title">Mon dashboard</h1>
      <p class="page-subtitle">Vue rapide de votre progression quotidienne.</p>
    </header>

    <p v-if="userStore.error" class="alert alert-error" role="alert">{{ userStore.error }}</p>

    <div v-if="userStore.loading && !userStore.metrics" class="loading" role="status">Chargement…</div>

    <section v-else-if="userStore.metrics" class="metrics-grid">
      <MetricsCard title="Série active" :value="userStore.metrics.streakDays" subtitle="jours consécutifs" variant="success" />
      <MetricsCard
        title="Objectifs semaine"
        :value="userStore.metrics.weeklyGoalProgress"
        :is-percentage="true"
        variant="info"
      />
      <MetricsCard
        title="Hydratation"
        :value="userStore.metrics.hydrationProgress"
        :is-percentage="true"
        variant="info"
      />
      <MetricsCard title="Calories" :value="userStore.calorieProgress" :is-percentage="true" variant="warning" />
    </section>
  </section>
</template>

<style scoped>
.page {
  padding: 1rem;
}

.page-header {
  margin-bottom: 1rem;
}

.page-title {
  margin: 0;
  color: #111827;
}

.page-subtitle {
  margin: 0.35rem 0 0;
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
