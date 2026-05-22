<script setup lang="ts">
import UserLayout from '@/layouts/UserLayout.vue'
import LLMSelector from '@/components/LLMSelector.vue'

const APP_VERSION = __APP_VERSION__
const GITHUB_URL = 'https://github.com/whitefoxxyt/MSPR-HealthAI-Coach-Dahsboard'
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
          Choisis le moteur d'analyse et de génération utilisé par VITAL pour tes plans repas.
          Le changement est appliqué immédiatement.
        </p>
      </header>

      <div class="settings-section__body">
        <LLMSelector />
      </div>
    </section>

    <section
      class="settings-section"
      aria-labelledby="settings-about-title"
      data-section="about"
    >
      <header class="settings-section__head">
        <p class="settings-section__eyebrow">02 · Informations</p>
        <h2 id="settings-about-title" class="settings-section__title">À propos</h2>
      </header>

      <dl class="about-grid">
        <div class="about-row">
          <dt class="about-row__key">Version frontend</dt>
          <dd class="about-row__val">
            <code>{{ APP_VERSION }}</code>
          </dd>
        </div>
        <div class="about-row">
          <dt class="about-row__key">Code source</dt>
          <dd class="about-row__val">
            <a
              class="about-link"
              :href="GITHUB_URL"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Ouvrir le dépôt GitHub dans un nouvel onglet"
            >
              github.com/whitefoxxyt/MSPR-HealthAI-Coach-Dahsboard
              <span aria-hidden="true">↗</span>
            </a>
          </dd>
        </div>
        <div class="about-row">
          <dt class="about-row__key">Contexte</dt>
          <dd class="about-row__val">
            Projet académique — soutenance MSPR 2 (TPRE502).
          </dd>
        </div>
      </dl>
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

.about-grid {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--sp-md);
  padding: var(--sp-lg);
  background: #ffffff;
  border-radius: var(--r-lg);
  border: 1px solid rgba(20, 20, 20, 0.04);
  box-shadow: var(--shadow-soft);
}

.about-row {
  display: grid;
  grid-template-columns: minmax(140px, 200px) 1fr;
  gap: var(--sp-md);
  align-items: baseline;
}

.about-row__key {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--c-gray-600);
}

.about-row__val {
  margin: 0;
  font-size: 0.9375rem;
  color: var(--c-onyx);
  word-break: break-word;
}

.about-row__val code {
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  padding: 0.15rem 0.5rem;
  background: rgba(20, 20, 20, 0.05);
  border-radius: var(--r-sm);
}

.about-link {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-xs);
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 3px;
  color: var(--c-onyx);
}

.about-link:hover {
  color: var(--c-acid-dark);
}

.about-link:focus-visible {
  outline: 2px solid var(--c-acid-dark);
  outline-offset: 3px;
  border-radius: var(--r-sm);
}

@media (max-width: 640px) {
  .about-row {
    grid-template-columns: 1fr;
    gap: var(--sp-xs);
  }
}
</style>
