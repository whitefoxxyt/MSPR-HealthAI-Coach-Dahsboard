<script setup lang="ts">
import UserLayout from '@/layouts/UserLayout.vue'
import LLMSelector from '@/components/LLMSelector.vue'
</script>

<template>
  <UserLayout
    eyebrow="Espace personnel"
    title="Paramètres."
  >
    <section class="settings-section" aria-labelledby="settings-ai-title">
      <header class="settings-section__head">
        <p class="settings-section__eyebrow">01 · Intelligence artificielle</p>
        <h2 id="settings-ai-title" class="settings-section__title">Préférence IA</h2>
        <p class="settings-section__desc">
          Choisis le moteur d'analyse et de génération utilisé par HealthAI Coach pour tes plans repas.
          Le changement est appliqué immédiatement.
        </p>
      </header>

      <div class="settings-section__body">
        <LLMSelector />
      </div>
    </section>
  </UserLayout>
</template>

<style scoped>
.settings-section {
  display: flex;
  flex-direction: column;
  gap: var(--sp-md);
  padding: var(--sp-xl) 0;
  border-top: 1px solid rgba(20, 20, 20, 0.08);
}

.settings-section:first-of-type {
  border-top: none;
  padding-top: 0;
}

.settings-section__head {
  display: flex;
  flex-direction: column;
  gap: var(--sp-xs);
  max-width: 56ch;
}

.settings-section__eyebrow {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--c-gray-600);
}

.settings-section__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(1.5rem, 2.4vw, 2rem);
  font-weight: 500;
  line-height: 1.1;
  letter-spacing: -0.015em;
  color: var(--c-onyx);
}

.settings-section__desc {
  margin: 0;
  font-size: 0.9375rem;
  color: var(--c-gray-800);
  line-height: 1.5;
}

.settings-section__body {
  display: flex;
  flex-direction: column;
  gap: var(--sp-md);
}
</style>
