<script setup lang="ts">
type Variant = 'neutral' | 'acid' | 'coral' | 'sky' | 'mint'
type Size = 'sm' | 'md'

const props = withDefaults(
  defineProps<{
    variant?: Variant
    size?: Size
  }>(),
  { variant: 'neutral', size: 'md' },
)
</script>

<template>
  <span :data-variant="props.variant" :data-size="props.size" class="app-badge">
    <slot />
  </span>
</template>

<style scoped>
.app-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-xs);
  font-family: var(--font-mono);
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  border-radius: var(--r-pill);
  border: 1px solid transparent;
  line-height: 1;
  white-space: nowrap;
}

.app-badge[data-size='sm'] {
  font-size: 0.625rem;
  padding: 0.25rem 0.55rem;
}
.app-badge[data-size='md'] {
  font-size: 0.6875rem;
  padding: 0.35rem 0.75rem;
}

.app-badge[data-variant='neutral'] {
  background: var(--c-gray-100);
  color: var(--c-gray-800);
  border-color: rgba(20, 20, 20, 0.06);
}
.app-badge[data-variant='acid'] {
  background: var(--c-acid);
  color: var(--c-onyx);
}
.app-badge[data-variant='coral'] {
  background: rgba(255, 107, 74, 0.16);
  color: #B7472F;
  border-color: rgba(255, 107, 74, 0.32);
}
.app-badge[data-variant='sky'] {
  background: rgba(107, 232, 255, 0.18);
  color: #1F8FA8;
  border-color: rgba(107, 232, 255, 0.36);
}
.app-badge[data-variant='mint'] {
  background: rgba(74, 255, 180, 0.18);
  color: #1F8E5C;
  border-color: rgba(74, 255, 180, 0.36);
}
</style>
