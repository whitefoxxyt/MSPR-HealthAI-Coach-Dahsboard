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
  color: var(--c-text);
  font-size: 0.9375rem;
  line-height: 1.5;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  border-radius: calc(var(--radius) * 0.67);
  border: 1px solid transparent;
  font-size: 0.875rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s, opacity 0.15s;
}

.btn:focus-visible {
  outline: 2px solid var(--c-brand);
  outline-offset: 2px;
}

.btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.btn-secondary {
  background: var(--c-surface);
  border-color: var(--c-border);
  color: var(--c-text-muted);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--c-bg);
  border-color: #94a3b8;
}

.btn-primary {
  background: var(--c-brand);
  color: #ffffff;
}

.btn-primary:hover:not(:disabled) {
  background: var(--c-brand-dark);
}

.btn-danger {
  background: var(--c-danger);
  color: #ffffff;
}

.btn-danger:hover:not(:disabled) {
  background: #b91c1c;
}

.btn-success {
  background: var(--c-brand);
  color: #ffffff;
}

.btn-success:hover:not(:disabled) {
  background: var(--c-brand-dark);
}
</style>
