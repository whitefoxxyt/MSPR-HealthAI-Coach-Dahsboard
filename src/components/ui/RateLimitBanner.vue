<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    retryAfter: number
    message?: string
  }>(),
  { message: 'Trop de requêtes. Réessaie dans' },
)

const emit = defineEmits<{ dismiss: [] }>()

const remaining = ref(Math.max(0, Math.floor(props.retryAfter)))
let timer: ReturnType<typeof setInterval> | null = null

function start() {
  stop()
  if (remaining.value <= 0) return
  timer = setInterval(() => {
    remaining.value = Math.max(0, remaining.value - 1)
    if (remaining.value === 0) stop()
  }, 1000)
}

function stop() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

watch(
  () => props.retryAfter,
  (next) => {
    remaining.value = Math.max(0, Math.floor(next))
    start()
  },
  { immediate: true },
)

onBeforeUnmount(stop)

const visible = computed(() => remaining.value > 0)

function onDismiss() {
  emit('dismiss')
}
</script>

<template>
  <Transition name="rate-limit">
    <div
      v-if="visible"
      role="status"
      aria-live="polite"
      class="rate-limit"
    >
      <div class="rate-limit__icon" aria-hidden="true">⏳</div>
      <p class="rate-limit__text">
        {{ props.message }}
        <strong class="rate-limit__count">{{ remaining }}s</strong>
      </p>
      <button
        type="button"
        data-dismiss
        class="rate-limit__close"
        aria-label="Fermer"
        @click="onDismiss"
      >×</button>
    </div>
  </Transition>
</template>

<style scoped>
.rate-limit {
  display: flex;
  align-items: center;
  gap: var(--sp-md);
  background: var(--c-onyx);
  color: var(--c-cream);
  padding: var(--sp-md) var(--sp-lg);
  border-radius: var(--r-lg);
  font-family: var(--font-body);
  border: 1px solid rgba(245, 240, 235, 0.08);
}

.rate-limit__icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.rate-limit__text {
  margin: 0;
  flex: 1;
  font-size: 0.9375rem;
}

.rate-limit__count {
  font-family: var(--font-mono);
  font-weight: 600;
  color: var(--c-acid);
  margin-left: 0.25rem;
}

.rate-limit__close {
  background: transparent;
  border: none;
  color: inherit;
  width: 28px;
  height: 28px;
  border-radius: var(--r-pill);
  font-size: 1.25rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  opacity: 0.7;
  transition: opacity var(--d-standard) var(--ease-out-expo);
}

.rate-limit__close:hover {
  opacity: 1;
}

.rate-limit__close:focus-visible {
  outline: 2px solid var(--c-acid);
  outline-offset: 2px;
}

.rate-limit-enter-active,
.rate-limit-leave-active {
  transition: opacity var(--d-standard) var(--ease-out-expo),
    transform var(--d-standard) var(--ease-out-expo);
}
.rate-limit-enter-from,
.rate-limit-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@media (prefers-reduced-motion: reduce) {
  .rate-limit-enter-active,
  .rate-limit-leave-active {
    transition: none;
  }
}
</style>
