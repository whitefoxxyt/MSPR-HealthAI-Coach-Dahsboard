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
  <button
    type="button"
    class="app-chip"
    :data-selected="props.selected ? 'true' : undefined"
    :disabled="props.disabled"
    :aria-pressed="props.selected ? 'true' : 'false'"
    @click="onClick"
  >
    <span class="app-chip__label">
      <slot />
    </span>
    <span
      v-if="props.removable"
      data-remove
      role="button"
      tabindex="-1"
      aria-label="Retirer"
      class="app-chip__remove"
      @click="onRemove"
    >×</span>
  </button>
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
  cursor: pointer;
  transition: background var(--d-standard) var(--ease-out-expo),
    border-color var(--d-standard) var(--ease-out-expo),
    color var(--d-standard) var(--ease-out-expo);
}

.app-chip:hover:not(:disabled) {
  border-color: var(--c-onyx);
}

.app-chip[data-selected='true'] {
  background: var(--c-onyx);
  color: var(--c-cream);
  border-color: var(--c-onyx);
}

.app-chip:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.app-chip:focus-visible {
  outline: 2px solid var(--c-acid-dark);
  outline-offset: 3px;
}

.app-chip__remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.1rem;
  height: 1.1rem;
  font-size: 1rem;
  line-height: 1;
  border-radius: 50%;
  color: inherit;
  cursor: pointer;
  opacity: 0.65;
  transition: opacity var(--d-standard) var(--ease-out-expo);
}

.app-chip__remove:hover {
  opacity: 1;
}
</style>
