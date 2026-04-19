<template>
  <div class="bk">
    <div class="kpi-grid">
      <MetricsCard
        title="Engagement"
        :value="analytics.businessKpis.engagementRate"
        :is-percentage="true"
        variant="success"
        trend="+3.2%"
        trend-direction="up"
      >
        <template #icon><font-awesome-icon :icon="['fas', 'fire']" /></template>
      </MetricsCard>

      <MetricsCard
        title="Conversion premium"
        :value="analytics.businessKpis.premiumConversionRate"
        :is-percentage="true"
        variant="info"
        trend="+1.1%"
        trend-direction="up"
      >
        <template #icon><font-awesome-icon :icon="['fas', 'gem']" /></template>
      </MetricsCard>

      <MetricsCard
        title="Satisfaction"
        :value="analytics.businessKpis.satisfactionRate"
        :is-percentage="true"
        variant="success"
        trend="+0.8%"
        trend-direction="up"
      >
        <template #icon><font-awesome-icon :icon="['fas', 'face-smile']" /></template>
      </MetricsCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AnalyticsOverview } from '@/types'
import MetricsCard from '@/components/common/MetricsCard.vue'

defineProps<{ analytics: AnalyticsOverview }>()
</script>

<style scoped>
.bk { display: flex; flex-direction: column; gap: 1.5rem; }

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.875rem;
}
</style>
