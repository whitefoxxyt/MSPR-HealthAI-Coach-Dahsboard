<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="open"
        class="modal-backdrop"
        @click.self="handleBackdropClick"
      >
        <div
          ref="panelRef"
          class="modal-panel"
          :class="`modal-panel--${variant}`"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          :aria-describedby="describedby"
          tabindex="-1"
          @keydown.esc.stop="emit('close')"
        >
          <header class="modal-header">
            <h2 :id="titleId" class="modal-title">{{ title }}</h2>
            <button
              type="button"
              class="modal-close"
              aria-label="Fermer la fenêtre"
              @click="emit('close')"
            >
              <font-awesome-icon :icon="['fas', 'xmark']" aria-hidden="true" />
            </button>
          </header>

          <div :id="describedby" class="modal-body">
            <slot />
          </div>

          <footer v-if="$slots.footer" class="modal-footer">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'

interface Props {
  open: boolean
  title: string
  variant?: 'default' | 'danger' | 'success'
  closeOnBackdrop?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  closeOnBackdrop: true,
})

const emit = defineEmits<{
  close: []
}>()

const panelRef = ref<HTMLElement | null>(null)
const uid = Math.random().toString(36).slice(2, 10)
const titleId = computed(() => `modal-title-${uid}`)
const describedby = computed(() => `modal-body-${uid}`)

function handleBackdropClick() {
  if (props.closeOnBackdrop) emit('close')
}

watch(
  () => props.open,
  async (next) => {
    if (next) {
      await nextTick()
      panelRef.value?.focus()
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  },
)
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background: rgba(17, 24, 39, 0.55);
  backdrop-filter: blur(2px);
}

.modal-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 520px;
  max-height: min(90vh, 720px);
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(0, 0, 0, 0.05);
  outline: none;
  overflow: hidden;
}

.modal-panel--danger {
  border-top: 4px solid #dc2626;
}

.modal-panel--success {
  border-top: 4px solid #059669;
}

.modal-panel--default {
  border-top: 4px solid #3b82f6;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.modal-title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  color: #111827;
}

.modal-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 6px;
  color: #6b7280;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}

.modal-close:hover {
  background: #fff;
  border-color: #e5e7eb;
  color: #111827;
}

.modal-close:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.modal-body {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
  color: #1f2937;
  font-size: 0.9375rem;
  line-height: 1.5;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

/* Transitions */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-active .modal-panel,
.modal-fade-leave-active .modal-panel {
  transition: transform 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .modal-panel,
.modal-fade-leave-to .modal-panel {
  transform: translateY(12px);
}

@media (prefers-reduced-motion: reduce) {
  .modal-fade-enter-active,
  .modal-fade-leave-active,
  .modal-fade-enter-active .modal-panel,
  .modal-fade-leave-active .modal-panel {
    transition: none;
  }
}

@media (max-width: 640px) {
  .modal-panel {
    max-width: 100%;
  }

  .modal-header,
  .modal-body,
  .modal-footer {
    padding-left: 1rem;
    padding-right: 1rem;
  }
}
</style>
