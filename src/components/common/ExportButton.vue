<template>
  <button
    class="export-button"
    :class="{ 'loading': loading }"
    :disabled="loading || disabled"
    @click="handleExport"
    :aria-busy="loading"
  >
    <span class="export-button__icon" :aria-hidden="true">
      {{ loading ? '⏳' : '📥' }}
    </span>
    <span class="export-button__text">
      {{ loading ? 'Export en cours...' : `Exporter ${format.toUpperCase()}` }}
    </span>
  </button>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { exportData } from '@/utils/helpers'
import type { ExportOptions } from '@/types'

interface Props {
  format: 'json' | 'csv'
  disabled?: boolean
  options?: Partial<ExportOptions>
}

interface Emits {
  (e: 'export-start'): void
  (e: 'export-success'): void
  (e: 'export-error', error: Error): void
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
})

const emit = defineEmits<Emits>()

const loading = ref(false)

async function handleExport() {
  loading.value = true
  emit('export-start')

  try {
    const exportOptions: ExportOptions = {
      format: props.format,
      includeMetadata: true,
      ...props.options,
    }

    await exportData(exportOptions)
    emit('export-success')
  } catch (error) {
    console.error('Export error:', error)
    emit('export-error', error as Error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.export-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  color: #374151;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.export-button:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #9ca3af;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.export-button:active:not(:disabled) {
  transform: translateY(0);
}

.export-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.export-button.loading {
  cursor: wait;
}

.export-button__icon {
  font-size: 1.25rem;
  line-height: 1;
}

.export-button__text {
  line-height: 1;
}

/* Accessibilité */
.export-button:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .export-button {
    transition: none;
  }
  
  .export-button:hover:not(:disabled) {
    transform: none;
  }
}
</style>
