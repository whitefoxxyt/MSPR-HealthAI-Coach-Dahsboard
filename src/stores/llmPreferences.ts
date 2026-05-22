import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  llmPreferencesApi,
  type LLMBackend,
  type LLMPreferencesView,
} from '@/services/aiNutritionApi'

export const useLLMPreferencesStore = defineStore('llmPreferences', () => {
  const preferredLlm = ref<LLMBackend | null>(null)
  const effectiveLlm = ref<LLMBackend | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const selected = computed<LLMBackend | null>(() => effectiveLlm.value)

  function applyView(view: LLMPreferencesView): void {
    preferredLlm.value = view.preferred_llm
    effectiveLlm.value = view.effective_llm
    error.value = null
  }

  async function fetchPreferences(): Promise<void> {
    loading.value = true
    try {
      applyView(await llmPreferencesApi.getPreferences())
    } catch (e) {
      error.value =
        e instanceof Error
          ? `Impossible de charger la preference LLM : ${e.message}`
          : 'Impossible de charger la preference LLM.'
    } finally {
      loading.value = false
    }
  }

  async function updatePreference(backend: LLMBackend): Promise<void> {
    loading.value = true
    try {
      applyView(await llmPreferencesApi.updatePreferences(backend))
    } catch (e) {
      error.value =
        e instanceof Error
          ? `Erreur lors de la mise a jour : ${e.message}`
          : 'Erreur lors de la mise a jour de la preference LLM.'
    } finally {
      loading.value = false
    }
  }

  return {
    preferredLlm,
    effectiveLlm,
    loading,
    error,
    selected,
    fetchPreferences,
    updatePreference,
  }
})
