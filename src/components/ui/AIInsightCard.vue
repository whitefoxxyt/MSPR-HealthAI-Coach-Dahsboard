<script setup lang="ts">
defineProps<{
  text: string
  backend?: string
}>()
</script>

<template>
  <article
    data-testid="ai-card"
    data-variant="acid"
    class="ai-card"
  >
    <header class="ai-card__head">
      <span data-testid="ai-badge" class="ai-card__badge">
        <span aria-hidden="true">✦</span> Coach IA
      </span>
      <span
        v-if="backend"
        data-testid="ai-backend"
        class="ai-card__backend"
      >via {{ backend }}</span>
    </header>
    <p class="ai-card__text">{{ text }}</p>
  </article>
</template>

<style scoped>
.ai-card {
  background: var(--c-acid);
  color: var(--c-onyx);
  border-radius: var(--r-lg);
  padding: var(--sp-lg);
  display: flex;
  flex-direction: column;
  gap: var(--sp-sm);
  border: 1px solid transparent;
  box-shadow: 0 8px 24px rgba(200, 255, 71, 0.30);
}

.ai-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-sm);
}

.ai-card__badge {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-xs);
  padding: 0.3rem 0.7rem;
  border-radius: var(--r-pill);
  background: var(--c-onyx);
  color: var(--c-acid);
  font-family: var(--font-mono);
  font-size: 0.625rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.ai-card__backend {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--c-gray-800);
}

.ai-card__text {
  margin: 0;
  font-family: var(--font-body);
  font-size: 1rem;
  line-height: 1.55;
  color: var(--c-onyx);
}
</style>
