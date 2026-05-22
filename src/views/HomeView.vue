<script setup lang="ts">
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { computed } from 'vue'
import UserLayout from '@/layouts/UserLayout.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

const showAdminDenied = computed(() => route.query.denied === 'admin')

function dismissDenied() {
  const next = { ...route.query }
  delete next.denied
  router.replace({ query: next })
}

const firstName = computed(() => {
  const username = authStore.currentUser?.username
  if (!username) return ''
  return username.split(/[ .@]/)[0] ?? username
})

interface Shortcut {
  to: string
  eyebrow: string
  title: string
  description: string
  glyph: string
  variant?: 'default' | 'acid'
}

const shortcuts: Shortcut[] = [
  {
    to: '/meal-analysis',
    eyebrow: 'IA · Vision',
    title: 'Analyser un repas',
    description: 'Photo → macros, aliments détectés, suggestion d\'amélioration.',
    glyph: '◐',
    variant: 'acid',
  },
  {
    to: '/meal-plan',
    eyebrow: 'IA · Nutrition',
    title: 'Générer un plan',
    description: 'Menu sur 1 à 7 jours selon ton régime, ton budget, tes objectifs.',
    glyph: '◑',
  },
  {
    to: '/fitness-program',
    eyebrow: 'IA · Performance',
    title: 'Programme fitness',
    description: 'Séances calibrées à ton niveau, équipement, contraintes.',
    glyph: '◉',
  },
]
</script>

<template>
  <UserLayout eyebrow="Coach IA — Nutrition · Performance" title="Bienvenue.">
    <template #actions>
      <AppBadge variant="acid" size="sm">Bêta</AppBadge>
    </template>

    <div
      v-if="showAdminDenied"
      role="status"
      class="denied-banner"
      data-denied="admin"
    >
      <span class="denied-banner__icon" aria-hidden="true">✦</span>
      <p class="denied-banner__text">
        <strong>Espace admin réservé.</strong>
        Cet espace est réservé aux administrateurs. Tu restes en vue utilisateur.
      </p>
      <button
        type="button"
        class="denied-banner__close"
        aria-label="Fermer"
        @click="dismissDenied"
      >×</button>
    </div>

    <p class="lead">
      Hello <span class="lead__name">{{ firstName || 'à toi' }}</span>.
      VITAL analyse tes repas, planifie tes menus, et adapte tes séances à ton corps.
      <em>Tout commence ici.</em>
    </p>

    <section aria-labelledby="shortcuts-title" class="block">
      <header class="block__head">
        <p class="block__eyebrow">01 · Démarrer</p>
        <h2 id="shortcuts-title" class="block__title">Trois gestes essentiels.</h2>
      </header>

      <div class="shortcuts">
        <RouterLink
          v-for="shortcut in shortcuts"
          :key="shortcut.to"
          :to="shortcut.to"
          class="shortcut"
          :data-variant="shortcut.variant || 'default'"
        >
          <span class="shortcut__glyph" aria-hidden="true">{{ shortcut.glyph }}</span>
          <p class="shortcut__eyebrow">{{ shortcut.eyebrow }}</p>
          <h3 class="shortcut__title">{{ shortcut.title }}</h3>
          <p class="shortcut__desc">{{ shortcut.description }}</p>
          <span class="shortcut__arrow" aria-hidden="true">→</span>
        </RouterLink>
      </div>
    </section>

    <section aria-labelledby="recent-title" class="block">
      <header class="block__head">
        <p class="block__eyebrow">02 · Tes dernières activités</p>
        <h2 id="recent-title" class="block__title">Rien ici pour l'instant.</h2>
      </header>

      <div class="cards">
        <AppCard eyebrow="Analyse repas" title="Dernière analyse">
          <EmptyState
            title="Aucune analyse"
            message="Tes prochaines analyses apparaîtront ici."
          >
            <template #action>
              <RouterLink to="/meal-analysis" class="link-cta">Analyser un repas →</RouterLink>
            </template>
          </EmptyState>
        </AppCard>

        <AppCard eyebrow="Plan repas" title="Dernier plan">
          <EmptyState
            title="Aucun plan"
            message="Lance ton premier plan repas pour 1 à 7 jours."
          >
            <template #action>
              <RouterLink to="/meal-plan" class="link-cta">Générer un plan →</RouterLink>
            </template>
          </EmptyState>
        </AppCard>

        <AppCard eyebrow="Programme fitness" title="Dernier programme">
          <EmptyState
            title="Aucun programme"
            message="Génère un programme adapté à ton profil."
          >
            <template #action>
              <RouterLink to="/fitness-program" class="link-cta">Programmer →</RouterLink>
            </template>
          </EmptyState>
        </AppCard>
      </div>
    </section>
  </UserLayout>
</template>

<style scoped>
.denied-banner {
  display: flex;
  align-items: center;
  gap: var(--sp-md);
  padding: var(--sp-md) var(--sp-lg);
  background: var(--c-onyx);
  color: var(--c-cream);
  border-radius: var(--r-lg);
  margin-bottom: var(--sp-xl);
}

.denied-banner__icon {
  font-family: var(--font-mono);
  font-size: 1.125rem;
  color: var(--c-acid);
  flex-shrink: 0;
}

.denied-banner__text {
  margin: 0;
  flex: 1;
  font-size: 0.9375rem;
  line-height: 1.45;
}

.denied-banner__text strong {
  font-weight: 600;
  margin-right: 0.35rem;
}

.denied-banner__close {
  background: transparent;
  border: none;
  color: inherit;
  font-size: 1.25rem;
  cursor: pointer;
  width: 28px;
  height: 28px;
  border-radius: var(--r-pill);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  opacity: 0.7;
  transition: opacity var(--d-standard) var(--ease-out-expo);
}

.denied-banner__close:hover {
  opacity: 1;
}

.denied-banner__close:focus-visible {
  outline: 2px solid var(--c-acid);
  outline-offset: 2px;
}

.lead {
  font-family: var(--font-display);
  font-size: clamp(1.25rem, 2vw, 1.75rem);
  line-height: 1.4;
  font-weight: 400;
  color: var(--c-gray-800);
  max-width: 56ch;
  margin: 0 0 var(--sp-2xl);
}

.lead__name {
  font-style: italic;
  color: var(--c-acid-dark);
}

.lead em {
  font-style: italic;
  color: var(--c-onyx);
}

.block {
  display: flex;
  flex-direction: column;
  gap: var(--sp-lg);
  margin-bottom: var(--sp-2xl);
}

.block__head {
  display: flex;
  flex-direction: column;
  gap: var(--sp-xs);
}

.block__eyebrow {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--c-gray-600);
}

.block__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(1.75rem, 3vw, 2.5rem);
  font-weight: 500;
  line-height: 1.1;
  letter-spacing: -0.015em;
  color: var(--c-onyx);
}

.shortcuts {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--sp-md);
}

.shortcut {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--sp-sm);
  text-decoration: none;
  background: #ffffff;
  border-radius: var(--r-lg);
  padding: var(--sp-lg) var(--sp-lg) calc(var(--sp-lg) + 8px);
  color: var(--c-onyx);
  border: 1px solid rgba(20, 20, 20, 0.04);
  box-shadow: var(--shadow-soft);
  overflow: hidden;
  transition:
    transform var(--d-standard) var(--ease-out-expo),
    box-shadow var(--d-standard) var(--ease-out-expo);
}

.shortcut:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lift);
}

.shortcut:focus-visible {
  outline: 2px solid var(--c-acid-dark);
  outline-offset: 4px;
}

.shortcut[data-variant='acid'] {
  background: var(--c-acid);
  border-color: transparent;
  box-shadow: 0 8px 24px rgba(200, 255, 71, 0.30);
}

.shortcut__glyph {
  font-family: var(--font-mono);
  font-size: 1.5rem;
  color: var(--c-gray-400);
  margin-bottom: var(--sp-md);
}
.shortcut[data-variant='acid'] .shortcut__glyph {
  color: var(--c-onyx);
}

.shortcut__eyebrow {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 0.625rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--c-gray-600);
}

.shortcut[data-variant='acid'] .shortcut__eyebrow {
  color: var(--c-gray-800);
}

.shortcut__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.65rem;
  line-height: 1.1;
  font-weight: 500;
  letter-spacing: -0.01em;
}

.shortcut__desc {
  margin: 0;
  font-size: 0.9375rem;
  color: var(--c-gray-600);
  line-height: 1.5;
  max-width: 30ch;
}
.shortcut[data-variant='acid'] .shortcut__desc {
  color: var(--c-gray-800);
}

.shortcut__arrow {
  position: absolute;
  bottom: var(--sp-md);
  right: var(--sp-md);
  font-size: 1.25rem;
  font-family: var(--font-mono);
  color: var(--c-onyx);
  opacity: 0.55;
  transition: transform var(--d-standard) var(--ease-out-expo), opacity var(--d-standard) var(--ease-out-expo);
}

.shortcut:hover .shortcut__arrow {
  transform: translateX(4px);
  opacity: 1;
}

.cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--sp-md);
}

.link-cta {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-xs);
  padding: 0.55rem 1.1rem;
  background: var(--c-onyx);
  color: var(--c-cream);
  border-radius: var(--r-pill);
  text-decoration: none;
  font-size: 0.8125rem;
  font-weight: 500;
  letter-spacing: -0.005em;
  transition: background var(--d-standard) var(--ease-out-expo);
}

.link-cta:hover {
  background: var(--c-onyx-2);
}

.link-cta:focus-visible {
  outline: 2px solid var(--c-acid-dark);
  outline-offset: 3px;
}

@media (max-width: 1024px) {
  .shortcuts,
  .cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .shortcuts,
  .cards {
    grid-template-columns: 1fr;
  }
  .lead {
    font-size: 1.125rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .shortcut,
  .shortcut__arrow {
    transition: none;
  }
  .shortcut:hover {
    transform: none;
  }
}
</style>
