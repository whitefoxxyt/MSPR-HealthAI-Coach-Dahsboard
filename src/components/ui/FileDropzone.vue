<script setup lang="ts">
import { ref } from 'vue'

const MAX_BYTES = 10 * 1024 * 1024
const IMAGE_MIME_RE = /^image\//

export type DropzoneErrorReason = 'type' | 'size'

export interface DropzoneError {
  reason: DropzoneErrorReason
  message: string
  file: File
}

const props = withDefaults(
  defineProps<{
    previewUrl?: string | null
    disabled?: boolean
    label?: string
    hint?: string
  }>(),
  {
    previewUrl: null,
    disabled: false,
    label: 'Glisse ta photo de repas',
    hint: 'PNG ou JPG, 10 Mo max',
  },
)

const emit = defineEmits<{
  file: [file: File]
  error: [error: DropzoneError]
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)

function validateAndEmit(file: File): void {
  if (!IMAGE_MIME_RE.test(file.type)) {
    emit('error', {
      reason: 'type',
      message: 'Le fichier doit être une image (PNG, JPG…).',
      file,
    })
    return
  }
  if (file.size > MAX_BYTES) {
    emit('error', {
      reason: 'size',
      message: 'Le fichier dépasse 10 Mo.',
      file,
    })
    return
  }
  emit('file', file)
}

function onInputChange(event: Event): void {
  if (props.disabled) return
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) validateAndEmit(file)
  target.value = ''
}

function onTriggerClick(): void {
  if (props.disabled) return
  inputRef.value?.click()
}

function onTriggerKey(event: KeyboardEvent): void {
  if (props.disabled) return
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    inputRef.value?.click()
  }
}

function onDrop(event: DragEvent): void {
  isDragging.value = false
  if (props.disabled) return
  const file = event.dataTransfer?.files?.[0]
  if (file) validateAndEmit(file)
}

function onDragOver(event: DragEvent): void {
  if (props.disabled) return
  event.preventDefault()
  isDragging.value = true
}

function onDragLeave(): void {
  isDragging.value = false
}
</script>

<template>
  <div
    data-testid="dropzone"
    class="dropzone"
    :data-dragging="isDragging ? 'true' : 'false'"
    :data-disabled="props.disabled ? 'true' : 'false'"
    @drop.prevent="onDrop"
    @dragover.prevent="onDragOver"
    @dragleave="onDragLeave"
  >
    <button
      v-if="!previewUrl"
      type="button"
      data-testid="dropzone-trigger"
      class="dropzone__trigger"
      :disabled="props.disabled"
      :aria-label="props.label"
      @click="onTriggerClick"
      @keydown="onTriggerKey"
    >
      <span class="dropzone__glyph" aria-hidden="true">◐</span>
      <span class="dropzone__label">{{ props.label }}</span>
      <span class="dropzone__hint">{{ props.hint }}</span>
    </button>

    <figure v-else class="dropzone__preview">
      <img
        :src="previewUrl"
        alt="Aperçu du repas sélectionné"
        data-testid="dropzone-preview"
      />
      <figcaption class="dropzone__preview-caption">
        Clique sur "Nouvelle analyse" pour changer de photo.
      </figcaption>
    </figure>

    <input
      ref="inputRef"
      type="file"
      class="dropzone__input"
      accept="image/png,image/jpeg,image/webp,image/*"
      :disabled="props.disabled"
      @change="onInputChange"
    />
  </div>
</template>

<style scoped>
.dropzone {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: center;
  min-height: 220px;
  border-radius: var(--r-lg);
  border: 2px dashed rgba(20, 20, 20, 0.18);
  background: #ffffff;
  padding: var(--sp-lg);
  transition: border-color var(--d-standard) var(--ease-out-expo),
    background var(--d-standard) var(--ease-out-expo);
}

.dropzone[data-dragging='true'] {
  border-color: var(--c-acid-dark);
  background: rgba(200, 255, 71, 0.10);
}

.dropzone[data-disabled='true'] {
  opacity: 0.6;
}

.dropzone__trigger {
  appearance: none;
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--sp-sm);
  padding: var(--sp-lg);
  width: 100%;
  color: var(--c-onyx);
  font-family: var(--font-body);
}

.dropzone__trigger:disabled {
  cursor: not-allowed;
}

.dropzone__trigger:focus-visible {
  outline: 2px solid var(--c-acid-dark);
  outline-offset: 3px;
  border-radius: var(--r-md);
}

.dropzone__glyph {
  font-family: var(--font-mono);
  font-size: 2.25rem;
  color: var(--c-gray-400);
}

.dropzone__label {
  font-family: var(--font-display);
  font-weight: 500;
  font-size: 1.25rem;
  letter-spacing: -0.01em;
}

.dropzone__hint {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--c-gray-600);
}

.dropzone__preview {
  margin: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--sp-sm);
}

.dropzone__preview img {
  max-width: 100%;
  max-height: 320px;
  border-radius: var(--r-md);
  object-fit: contain;
  box-shadow: var(--shadow-soft);
}

.dropzone__preview-caption {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--c-gray-600);
}

.dropzone__input {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}
</style>
