<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useLLMPreferencesStore } from '@/stores/llmPreferences'
import type { LLMBackend } from '@/services/aiNutritionApi'

interface BackendInfo {
  label: string
  model: string
  latency: string
}

const BACKEND_INFO: Record<LLMBackend, BackendInfo> = {
  mistral: { label: 'Mistral (managed)', model: 'mistral-small-latest', latency: '~2s' },
  ollama: { label: 'Ollama (local)', model: 'gemma3:4b', latency: '~60s' },
}

const store = useLLMPreferencesStore()
const { selected, error } = storeToRefs(store)

const currentInfo = computed<BackendInfo | null>(() =>
  selected.value ? BACKEND_INFO[selected.value] : null,
)

function onSelect(event: Event): void {
  const target = event.target as HTMLInputElement
  void store.updatePreference(target.value as LLMBackend)
}

onMounted(() => {
  void store.fetchPreferences()
})
</script>

<template>
  <section class="llm-selector" aria-labelledby="llm-selector-title">
    <header class="llm-selector__header">
      <h3 id="llm-selector-title" class="llm-selector__title">Backend LLM</h3>
      <p class="llm-selector__desc">
        Choix du moteur de generation de plans repas. Bascule appliquee instantanement.
      </p>
    </header>

    <div class="llm-selector__options" role="radiogroup" aria-label="Backend LLM">
      <label class="llm-option" :class="{ 'llm-option--active': selected === 'mistral' }">
        <input
          type="radio"
          name="llm-backend"
          value="mistral"
          :checked="selected === 'mistral'"
          @change="onSelect"
        />
        <span class="llm-option__label">{{ BACKEND_INFO.mistral.label }}</span>
      </label>
      <label class="llm-option" :class="{ 'llm-option--active': selected === 'ollama' }">
        <input
          type="radio"
          name="llm-backend"
          value="ollama"
          :checked="selected === 'ollama'"
          @change="onSelect"
        />
        <span class="llm-option__label">{{ BACKEND_INFO.ollama.label }}</span>
      </label>
    </div>

    <p v-if="currentInfo" class="llm-info">
      Backend actuel : <strong>{{ currentInfo.model }}</strong>
      <span class="llm-latency">latence estimee {{ currentInfo.latency }}</span>
    </p>
    <p v-if="error" class="llm-error" role="alert">{{ error }}</p>
  </section>
</template>

<style scoped>
.llm-selector {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  padding: 1.25rem 1.5rem;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: 0.875rem;
}

.llm-selector__header {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.llm-selector__title {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--c-text);
  letter-spacing: -0.01em;
}

.llm-selector__desc {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--c-text-muted);
}

.llm-selector__options {
  display: flex;
  gap: 0.625rem;
  flex-wrap: wrap;
}

.llm-option {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.875rem;
  background: var(--c-surface-2);
  border: 1px solid var(--c-border);
  border-radius: 0.5rem;
  cursor: pointer;
  transition:
    border-color 0.15s,
    background 0.15s;
  font-size: 0.875rem;
  color: var(--c-text);
}

.llm-option:hover {
  border-color: rgba(255, 255, 255, 0.18);
}

.llm-option--active {
  border-color: var(--c-brand);
  background: var(--c-brand-xlight);
}

.llm-option input {
  accent-color: var(--c-brand);
}

.llm-info {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--c-text-muted);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.llm-info strong {
  color: var(--c-text);
  font-weight: 600;
}

.llm-latency {
  font-size: 0.75rem;
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
  background: var(--c-surface-2);
  border: 1px solid var(--c-border);
}

.llm-error {
  margin: 0;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  background: var(--c-danger-light);
  border: 1px solid rgba(255, 69, 58, 0.35);
  color: var(--c-danger);
  font-size: 0.8125rem;
}
</style>
