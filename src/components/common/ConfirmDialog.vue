<template>
  <BaseModal
    :open="open"
    :title="title"
    :variant="variant"
    :close-on-backdrop="!loading"
    @close="emit('cancel')"
  >
    <p class="confirm-dialog__message">{{ message }}</p>

    <template #footer>
      <button
        type="button"
        class="btn btn-secondary"
        :disabled="loading"
        @click="emit('cancel')"
      >
        {{ cancelLabel }}
      </button>
      <button
        type="button"
        class="btn"
        :class="confirmButtonClass"
        :disabled="loading"
        @click="emit('confirm')"
      >
        {{ loading ? 'Traitement…' : confirmLabel }}
      </button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import BaseModal from './BaseModal.vue'

interface Props {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'danger' | 'success'
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  confirmLabel: 'Confirmer',
  cancelLabel: 'Annuler',
  variant: 'default',
  loading: false,
})

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const confirmButtonClass = computed(() => {
  if (props.variant === 'danger') return 'btn-danger'
  if (props.variant === 'success') return 'btn-success'
  return 'btn-primary'
})
</script>

<style scoped>
.confirm-dialog__message {
  margin: 0;
  color: #374151;
  font-size: 0.9375rem;
  line-height: 1.5;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  border-radius: 6px;
  border: 1px solid transparent;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s, opacity 0.15s;
}

.btn:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.btn-secondary {
  background: #ffffff;
  border-color: #d1d5db;
  color: #374151;
}

.btn-secondary:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #9ca3af;
}

.btn-primary {
  background: #3b82f6;
  color: #ffffff;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-danger {
  background: #dc2626;
  color: #ffffff;
}

.btn-danger:hover:not(:disabled) {
  background: #b91c1c;
}

.btn-success {
  background: #059669;
  color: #ffffff;
}

.btn-success:hover:not(:disabled) {
  background: #047857;
}
</style>
