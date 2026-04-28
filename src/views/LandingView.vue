<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <main class="landing" aria-labelledby="landing-title">
    <section class="hero">
      <p class="hero__eyebrow">HealthAI Coach</p>
      <h1 id="landing-title" class="hero__title">Suivez vos objectifs santé au quotidien</h1>
      <p class="hero__subtitle">
        Dashboard utilisateur pour piloter nutrition, activité et progression, avec un accès admin conservé.
      </p>
      <div class="hero__actions">
        <RouterLink to="/auth" class="hero__button hero__button--primary">Se connecter</RouterLink>
        <RouterLink to="/dashboard" class="hero__button hero__button--secondary">Voir mon dashboard</RouterLink>
      </div>
    </section>
  </main>
</template>

<style scoped>
.landing {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 1.25rem;
  background: radial-gradient(circle at top, #dbeafe 0%, #f8fafc 45%, #ffffff 100%);
}

.hero {
  width: 100%;
  max-width: 680px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.5rem;
}

.hero__eyebrow {
  margin: 0 0 0.5rem;
  color: #2563eb;
  font-size: 0.875rem;
  font-weight: 700;
  text-transform: uppercase;
}

.hero__title {
  margin: 0;
  color: #111827;
  line-height: 1.25;
}

.hero__subtitle {
  margin: 0.75rem 0 0;
  color: #4b5563;
}

.hero__actions {
  margin-top: 1.25rem;
  display: grid;
  gap: 0.75rem;
}

.hero__button {
  min-height: 44px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  font-weight: 700;
}

.hero__button--primary {
  background: #2563eb;
  color: #ffffff;
}

.hero__button--secondary {
  border: 1px solid #d1d5db;
  color: #374151;
}

.hero__button:focus-visible {
  outline: 2px solid #93c5fd;
  outline-offset: 2px;
}

@media (min-width: 768px) {
  .hero {
    padding: 2rem;
  }

  .hero__actions {
    display: flex;
  }
}
</style>
