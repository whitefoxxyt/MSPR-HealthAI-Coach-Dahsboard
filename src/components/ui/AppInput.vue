<script setup lang="ts">
import { computed, useId } from 'vue'

const props = withDefaults(
  defineProps<{
    label: string
    modelValue: string
    type?: string
    placeholder?: string
    hint?: string
    error?: string
    required?: boolean
    autocomplete?: string
    disabled?: boolean
  }>(),
  { type: 'text' },
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const inputId = useId()
const hintId = computed(() => (props.hint ? `${inputId}-hint` : undefined))
const errorId = computed(() => (props.error ? `${inputId}-error` : undefined))
const describedBy = computed(() =>
  [errorId.value, hintId.value].filter(Boolean).join(' ') || undefined,
)

function onInput(event: Event) {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}
</script>

<template>
  <div class="app-input" :data-has-error="props.error ? '' : undefined">
    <label :for="inputId" class="app-input__label">{{ props.label }}</label>
    <input
      :id="inputId"
      :type="props.type"
      :value="props.modelValue"
      :placeholder="props.placeholder"
      :required="props.required"
      :autocomplete="props.autocomplete"
      :disabled="props.disabled"
      :aria-invalid="props.error ? 'true' : undefined"
      :aria-describedby="describedBy"
      class="app-input__field"
      @input="onInput"
    />
    <p v-if="props.error" :id="errorId" data-error class="app-input__error" role="alert">
      {{ props.error }}
    </p>
    <p v-else-if="props.hint" :id="hintId" data-hint class="app-input__hint">
      {{ props.hint }}
    </p>
  </div>
</template>

<style scoped>
.app-input {
  display: flex;
  flex-direction: column;
  gap: var(--sp-xs);
  font-family: var(--font-body);
}

.app-input__label {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--c-gray-800);
  letter-spacing: -0.005em;
}

.app-input__field {
  appearance: none;
  border: 1px solid var(--c-gray-200);
  background: #ffffff;
  border-radius: var(--r-md);
  padding: 0.85rem 1rem;
  font: inherit;
  font-size: 0.9375rem;
  color: var(--c-onyx);
  transition: border-color var(--d-standard) var(--ease-out-expo),
    box-shadow var(--d-standard) var(--ease-out-expo);
  min-height: 48px;
}

.app-input__field::placeholder {
  color: var(--c-gray-400);
}

.app-input__field:hover {
  border-color: var(--c-gray-400);
}

.app-input__field:focus {
  outline: none;
  border-color: var(--c-onyx);
  box-shadow: 0 0 0 3px rgba(200, 255, 71, 0.45);
}

.app-input__field:disabled {
  background: var(--c-cream-2);
  color: var(--c-gray-400);
  cursor: not-allowed;
}

.app-input[data-has-error] .app-input__field {
  border-color: var(--c-coral);
}
.app-input[data-has-error] .app-input__field:focus {
  box-shadow: 0 0 0 3px rgba(255, 107, 74, 0.30);
}

.app-input__error {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--c-coral);
}

.app-input__hint {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--c-gray-600);
}
</style>
