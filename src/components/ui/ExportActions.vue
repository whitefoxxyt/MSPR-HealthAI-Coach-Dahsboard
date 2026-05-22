<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue'

defineProps<{
  ariaLabel?: string
}>()

const emit = defineEmits<{
  'export-pdf': []
  'export-json': []
}>()
</script>

<template>
  <div class="export-actions" :aria-label="ariaLabel ?? 'Exporter'">
    <AppButton
      data-testid="export-pdf-button"
      variant="outline"
      size="sm"
      @click="emit('export-pdf')"
    >Exporter PDF</AppButton>
    <AppButton
      data-testid="export-json-button"
      variant="outline"
      size="sm"
      @click="emit('export-json')"
    >Exporter JSON</AppButton>
  </div>
</template>

<style scoped>
.export-actions {
  display: inline-flex;
  gap: var(--sp-sm);
  flex-wrap: wrap;
}
</style>
