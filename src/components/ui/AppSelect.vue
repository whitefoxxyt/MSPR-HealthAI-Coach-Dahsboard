<script setup lang="ts">
import { computed, useId } from 'vue'

interface Option {
  value: string
  label: string
}

const props = defineProps<{
  label: string
  modelValue: string
  options: Option[]
  hint?: string
  error?: string
  disabled?: boolean
}>()

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const selectId = useId()
const hintId = computed(() => (props.hint ? `${selectId}-hint` : undefined))
const errorId = computed(() => (props.error ? `${selectId}-error` : undefined))
const describedBy = computed(() =>
  [errorId.value, hintId.value].filter(Boolean).join(' ') || undefined,
)

function onChange(event: Event) {
  emit('update:modelValue', (event.target as HTMLSelectElement).value)
}
</script>

<template>
  <div class="app-select" :data-has-error="props.error ? '' : undefined">
    <label :for="selectId" class="app-select__label">{{ props.label }}</label>
    <div class="app-select__wrapper">
      <select
        :id="selectId"
        :value="props.modelValue"
        :disabled="props.disabled"
        :aria-invalid="props.error ? 'true' : undefined"
        :aria-describedby="describedBy"
        class="app-select__control"
        @change="onChange"
      >
        <option v-for="opt in props.options" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>
      <span class="app-select__caret" aria-hidden="true">▾</span>
    </div>
    <p v-if="props.error" :id="errorId" data-error class="app-select__error" role="alert">
      {{ props.error }}
    </p>
    <p v-else-if="props.hint" :id="hintId" class="app-select__hint">{{ props.hint }}</p>
  </div>
</template>

<style scoped>
.app-select {
  display: flex;
  flex-direction: column;
  gap: var(--sp-xs);
  font-family: var(--font-body);
}

.app-select__label {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--c-gray-800);
}

.app-select__wrapper {
  position: relative;
}

.app-select__control {
  appearance: none;
  width: 100%;
  border: 1px solid var(--c-gray-200);
  background: #ffffff;
  border-radius: var(--r-md);
  padding: 0.85rem 2.5rem 0.85rem 1rem;
  font: inherit;
  font-size: 0.9375rem;
  color: var(--c-onyx);
  min-height: 48px;
  cursor: pointer;
  transition: border-color var(--d-standard) var(--ease-out-expo),
    box-shadow var(--d-standard) var(--ease-out-expo);
}

.app-select__control:hover {
  border-color: var(--c-gray-400);
}

.app-select__control:focus {
  outline: none;
  border-color: var(--c-onyx);
  box-shadow: 0 0 0 3px rgba(200, 255, 71, 0.45);
}

.app-select__control:disabled {
  cursor: not-allowed;
  color: var(--c-gray-400);
  background: var(--c-cream-2);
}

.app-select[data-has-error] .app-select__control {
  border-color: var(--c-coral);
}

.app-select__caret {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: var(--c-gray-600);
  font-size: 0.8125rem;
}

.app-select__error {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--c-coral);
}

.app-select__hint {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--c-gray-600);
}
</style>
