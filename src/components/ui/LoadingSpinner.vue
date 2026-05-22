<script setup lang="ts">
type Size = 'sm' | 'md' | 'lg'

withDefaults(
  defineProps<{
    label?: string
    size?: Size
    accent?: 'onyx' | 'acid' | 'cream'
  }>(),
  { label: 'Chargement en cours', size: 'md', accent: 'onyx' },
)
</script>

<template>
  <span :data-size="size" :data-accent="accent" class="spinner" role="status" :aria-label="label">
    <span class="spinner__ring" aria-hidden="true" />
    <span class="sr-only">{{ label }}</span>
  </span>
</template>

<style scoped>
.spinner {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-mono);
}

.spinner__ring {
  border-radius: 50%;
  border-style: solid;
  border-color: var(--c-gray-200);
  border-top-color: var(--c-onyx);
  animation: spinnerRotate 0.85s linear infinite;
  display: inline-block;
}

.spinner[data-accent='acid'] .spinner__ring {
  border-color: rgba(20, 20, 20, 0.10);
  border-top-color: var(--c-acid-dark);
}
.spinner[data-accent='cream'] .spinner__ring {
  border-color: rgba(245, 240, 235, 0.20);
  border-top-color: var(--c-cream);
}

.spinner[data-size='sm'] .spinner__ring {
  width: 18px;
  height: 18px;
  border-width: 2px;
}
.spinner[data-size='md'] .spinner__ring {
  width: 28px;
  height: 28px;
  border-width: 3px;
}
.spinner[data-size='lg'] .spinner__ring {
  width: 44px;
  height: 44px;
  border-width: 3px;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@keyframes spinnerRotate {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .spinner__ring {
    animation: none;
  }
}
</style>
