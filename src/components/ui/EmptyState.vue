<script setup lang="ts">
defineProps<{
  title: string
  message?: string
  icon?: string
}>()
</script>

<template>
  <div class="empty-state" role="status">
    <div v-if="icon" class="empty-state__icon" aria-hidden="true">{{ icon }}</div>
    <slot v-else name="icon" />
    <h3 class="empty-state__title">{{ title }}</h3>
    <p v-if="message" class="empty-state__message">{{ message }}</p>
    <div v-if="$slots.action" class="empty-state__action">
      <slot name="action" />
    </div>
  </div>
</template>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--sp-sm);
  padding: var(--sp-xl) var(--sp-lg);
  font-family: var(--font-body);
  color: var(--c-gray-600);
  border-radius: var(--r-lg);
  background: var(--c-cream-2);
  border: 1px dashed var(--c-gray-200);
}

.empty-state__icon {
  width: 56px;
  height: 56px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--r-pill);
  background: var(--c-acid);
  color: var(--c-onyx);
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: var(--sp-xs);
}

.empty-state__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 500;
  color: var(--c-onyx);
  line-height: 1.2;
  letter-spacing: -0.01em;
}

.empty-state__message {
  margin: 0;
  max-width: 36ch;
  font-size: 0.9375rem;
  line-height: 1.5;
}

.empty-state__action {
  margin-top: var(--sp-md);
}
</style>
