<script setup lang="ts">
import { computed } from 'vue'

type Variant = 'default' | 'elevated' | 'outline' | 'acid'

const props = withDefaults(
  defineProps<{
    title?: string
    eyebrow?: string
    variant?: Variant
  }>(),
  { variant: 'default' },
)

const showHeader = computed(() => Boolean(props.title || props.eyebrow))
</script>

<template>
  <article :data-variant="props.variant" class="app-card">
    <header v-if="showHeader" data-card-header class="app-card__header">
      <p v-if="props.eyebrow" data-eyebrow class="app-card__eyebrow">{{ props.eyebrow }}</p>
      <h3 v-if="props.title" class="app-card__title">{{ props.title }}</h3>
    </header>
    <div class="app-card__body">
      <slot />
    </div>
  </article>
</template>

<style scoped>
.app-card {
  background: #ffffff;
  border-radius: var(--r-lg);
  padding: var(--sp-lg);
  display: flex;
  flex-direction: column;
  gap: var(--sp-md);
  border: 1px solid transparent;
  transition: transform var(--d-standard) var(--ease-out-expo),
    box-shadow var(--d-standard) var(--ease-out-expo);
  font-family: var(--font-body);
  color: var(--c-onyx);
}

.app-card[data-variant='default'] {
  box-shadow: var(--shadow-soft);
}

.app-card[data-variant='elevated'] {
  box-shadow: var(--shadow-lift);
}

.app-card[data-variant='outline'] {
  background: transparent;
  border-color: rgba(20, 20, 20, 0.12);
  box-shadow: none;
}

.app-card[data-variant='acid'] {
  background: var(--c-acid);
  color: var(--c-onyx);
  box-shadow: 0 12px 32px rgba(200, 255, 71, 0.35);
}

.app-card__header {
  display: flex;
  flex-direction: column;
  gap: var(--sp-xs);
}

.app-card__eyebrow {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  font-weight: 500;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--c-gray-600);
}

.app-card[data-variant='acid'] .app-card__eyebrow {
  color: var(--c-gray-800);
}

.app-card__title {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 500;
  font-size: 1.5rem;
  line-height: 1.15;
  letter-spacing: -0.01em;
}

.app-card__body {
  display: flex;
  flex-direction: column;
  gap: var(--sp-md);
}
</style>
