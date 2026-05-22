<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    selected?: boolean
    removable?: boolean
    disabled?: boolean
  }>(),
  { selected: false, removable: false, disabled: false },
)

const emit = defineEmits<{
  toggle: []
  remove: []
}>()

function onClick() {
  if (props.disabled) return
  emit('toggle')
}

function onRemove(event: MouseEvent) {
  event.stopPropagation()
  emit('remove')
}
</script>

<template>
  <span
    class="app-chip"
    :data-selected="props.selected ? 'true' : undefined"
    :data-disabled="props.disabled ? 'true' : undefined"
  >
    <button
      type="button"
      class="app-chip__toggle"
      :disabled="props.disabled"
      :aria-pressed="props.selected ? 'true' : 'false'"
      @click="onClick"
    >
      <slot />
    </button>
    <button
      v-if="props.removable"
      type="button"
      data-remove
      :disabled="props.disabled"
      aria-label="Retirer"
      class="app-chip__remove"
      @click="onRemove"
    >×</button>
  </span>
</template>

<style scoped>
.app-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-xs);
  font-family: var(--font-body);
  font-size: 0.8125rem;
  font-weight: 500;
  padding: 0.4rem 0.85rem;
  border-radius: var(--r-pill);
  border: 1px solid var(--c-gray-200);
  background: #ffffff;
  color: var(--c-onyx);
  transition: background var(--d-standard) var(--ease-out-expo),
    border-color var(--d-standard) var(--ease-out-expo),
    color var(--d-standard) var(--ease-out-expo);
}

.app-chip:hover:not([data-disabled='true']) {
  border-color: var(--c-onyx);
}

.app-chip[data-selected='true'] {
  background: var(--c-onyx);
  color: var(--c-cream);
  border-color: var(--c-onyx);
}

.app-chip[data-disabled='true'] {
  opacity: 0.5;
}

.app-chip__toggle {
  appearance: none;
  background: transparent;
  border: none;
  padding: 0;
  margin: 0;
  font: inherit;
  color: inherit;
  cursor: pointer;
}

.app-chip__toggle:disabled {
  cursor: not-allowed;
}

.app-chip__toggle:focus-visible {
  outline: 2px solid var(--c-acid-dark);
  outline-offset: 4px;
  border-radius: var(--r-sm);
}

.app-chip__remove {
  appearance: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.1rem;
  height: 1.1rem;
  padding: 0;
  font-size: 1rem;
  line-height: 1;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: inherit;
  cursor: pointer;
  opacity: 0.65;
  transition: opacity var(--d-standard) var(--ease-out-expo);
}

.app-chip__remove:hover:not(:disabled) {
  opacity: 1;
}

.app-chip__remove:focus-visible {
  outline: 2px solid var(--c-acid-dark);
  outline-offset: 2px;
  opacity: 1;
}

.app-chip__remove:disabled {
  cursor: not-allowed;
}
</style>
