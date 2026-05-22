<script setup lang="ts">
type Variant = 'primary' | 'acid' | 'outline' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

const props = withDefaults(
  defineProps<{
    variant?: Variant
    size?: Size
    type?: 'button' | 'submit' | 'reset'
    disabled?: boolean
    loading?: boolean
  }>(),
  {
    variant: 'primary',
    size: 'md',
    type: 'button',
    disabled: false,
    loading: false,
  },
)

const emit = defineEmits<{ click: [event: MouseEvent] }>()

function onClick(event: MouseEvent) {
  if (props.disabled || props.loading) return
  emit('click', event)
}
</script>

<template>
  <button
    :type="props.type"
    :data-variant="props.variant"
    :data-size="props.size"
    :disabled="props.disabled || props.loading"
    :aria-busy="props.loading ? 'true' : undefined"
    class="app-btn"
    @click="onClick"
  >
    <span v-if="props.loading" class="app-btn__spinner" aria-hidden="true" />
    <span class="app-btn__label">
      <slot />
    </span>
  </button>
</template>

<style scoped>
.app-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--sp-sm);
  font-family: var(--font-body);
  font-weight: 600;
  letter-spacing: -0.005em;
  border-radius: var(--r-pill);
  border: 1px solid transparent;
  cursor: pointer;
  transition: transform var(--d-micro) var(--ease-out-expo),
    background var(--d-standard) var(--ease-out-expo),
    color var(--d-standard) var(--ease-out-expo),
    border-color var(--d-standard) var(--ease-out-expo),
    box-shadow var(--d-standard) var(--ease-out-expo);
  user-select: none;
}

.app-btn:focus-visible {
  outline: 2px solid var(--c-acid-dark);
  outline-offset: 3px;
}

.app-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.app-btn:not(:disabled):active {
  transform: translateY(1px);
}

/* Sizes */
.app-btn[data-size='sm'] {
  font-size: 0.8125rem;
  padding: 0.5rem 1rem;
  min-height: 36px;
}
.app-btn[data-size='md'] {
  font-size: 0.9375rem;
  padding: 0.7rem 1.35rem;
  min-height: 44px;
}
.app-btn[data-size='lg'] {
  font-size: 1rem;
  padding: 0.95rem 1.75rem;
  min-height: 52px;
}

/* Variants */
.app-btn[data-variant='primary'] {
  background: var(--c-onyx);
  color: var(--c-cream);
}
.app-btn[data-variant='primary']:hover:not(:disabled) {
  background: var(--c-onyx-2);
  box-shadow: var(--shadow-lift);
}

.app-btn[data-variant='acid'] {
  background: var(--c-acid);
  color: var(--c-onyx);
}
.app-btn[data-variant='acid']:hover:not(:disabled) {
  background: var(--c-acid-dark);
  box-shadow: 0 0 0 6px rgba(200, 255, 71, 0.18);
}

.app-btn[data-variant='outline'] {
  background: transparent;
  color: var(--c-onyx);
  border-color: var(--c-onyx);
}
.app-btn[data-variant='outline']:hover:not(:disabled) {
  background: var(--c-onyx);
  color: var(--c-cream);
}

.app-btn[data-variant='ghost'] {
  background: transparent;
  color: var(--c-onyx);
}
.app-btn[data-variant='ghost']:hover:not(:disabled) {
  background: rgba(20, 20, 20, 0.06);
}

/* Loading spinner */
.app-btn__spinner {
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  border: 2px solid currentColor;
  border-top-color: transparent;
  animation: appBtnSpin 0.8s linear infinite;
}

@keyframes appBtnSpin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .app-btn,
  .app-btn__spinner {
    transition: none;
    animation: none;
  }
}
</style>
