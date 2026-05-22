<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { isCurrentUserAdmin } from '@/utils/auth-role'

defineProps<{
  title?: string
  eyebrow?: string
}>()

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const drawerOpen = ref(false)
const isAdmin = ref(false)

function refreshAdminFlag() {
  isAdmin.value = isCurrentUserAdmin()
}

onMounted(refreshAdminFlag)
watch(() => authStore.session?.tokens.accessToken, refreshAdminFlag)
watch(() => route.fullPath, () => (drawerOpen.value = false))

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') drawerOpen.value = false
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))

const initials = computed(() => {
  const username = authStore.currentUser?.username ?? authStore.currentUser?.email ?? ''
  return username
    .split(/[ .@]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'VT'
})

const navItems = [
  { name: 'home', to: '/', icon: '◇', label: 'Accueil' },
  { name: 'meal-analysis', to: '/meal-analysis', icon: '◐', label: 'Analyse repas' },
  { name: 'meal-plan', to: '/meal-plan', icon: '◑', label: 'Plan repas' },
  { name: 'fitness-program', to: '/fitness-program', icon: '◉', label: 'Programme fitness' },
  { name: 'profile', to: '/profil', icon: '✦', label: 'Profil' },
  { name: 'settings', to: '/parametres', icon: '⚙', label: 'Paramètres' },
]

async function handleLogout() {
  await authStore.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="user-shell">
    <a href="#main-content" class="skip-link">Aller au contenu principal</a>

    <!-- Mobile topbar -->
    <header class="mobile-topbar" role="banner">
      <RouterLink to="/" class="brand brand--compact" aria-label="VITAL — accueil">
        <span class="brand__mark" aria-hidden="true">V</span>
        <span class="brand__name">VITAL</span>
      </RouterLink>
      <button
        type="button"
        class="hamburger"
        :aria-expanded="drawerOpen"
        aria-controls="user-sidebar"
        aria-label="Ouvrir le menu"
        @click="drawerOpen = !drawerOpen"
      >
        <span class="hamburger__line" />
        <span class="hamburger__line" />
        <span class="hamburger__line" />
      </button>
    </header>

    <!-- Sidebar -->
    <aside
      id="user-sidebar"
      class="sidebar"
      :data-open="drawerOpen ? 'true' : 'false'"
      aria-label="Navigation principale"
    >
      <div class="sidebar__head">
        <RouterLink to="/" class="brand" aria-label="VITAL — accueil">
          <span class="brand__mark" aria-hidden="true">V</span>
          <div class="brand__group">
            <span class="brand__name">VITAL</span>
            <span class="brand__tag">Coach IA — Nutrition · Performance</span>
          </div>
        </RouterLink>
      </div>

      <nav class="sidebar__nav" aria-label="Sections de l'application">
        <RouterLink
          v-for="item in navItems"
          :key="item.name"
          :to="item.to"
          class="nav-link"
          active-class="nav-link--active"
          :exact="item.to === '/'"
        >
          <span class="nav-link__icon" aria-hidden="true">{{ item.icon }}</span>
          <span class="nav-link__label">{{ item.label }}</span>
        </RouterLink>
      </nav>

      <div class="sidebar__foot">
        <RouterLink
          v-if="isAdmin"
          to="/admin"
          class="switch-link"
          data-switch-admin
        >
          <span aria-hidden="true">⇆</span>
          Vue admin
        </RouterLink>

        <div class="user-card">
          <div class="user-card__avatar" aria-hidden="true">{{ initials }}</div>
          <div class="user-card__meta">
            <p class="user-card__name">{{ authStore.currentUser?.username ?? 'Invité' }}</p>
            <p class="user-card__email">{{ authStore.currentUser?.email ?? '' }}</p>
          </div>
          <button
            type="button"
            class="user-card__logout"
            aria-label="Se déconnecter"
            @click="handleLogout"
          >↳</button>
        </div>
      </div>
    </aside>

    <!-- Backdrop -->
    <div
      v-if="drawerOpen"
      class="backdrop"
      aria-hidden="true"
      @click="drawerOpen = false"
    />

    <!-- Main -->
    <div class="main-area">
      <header v-if="title || eyebrow || $slots.actions" class="topbar">
        <div class="topbar__heading">
          <p v-if="eyebrow" class="topbar__eyebrow">{{ eyebrow }}</p>
          <h1 v-if="title" class="topbar__title">{{ title }}</h1>
        </div>
        <div v-if="$slots.actions" class="topbar__actions">
          <slot name="actions" />
        </div>
      </header>

      <main id="main-content" class="content" tabindex="-1">
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped>
.user-shell {
  --sidebar-width: 268px;

  min-height: 100vh;
  display: grid;
  grid-template-columns: var(--sidebar-width) 1fr;
  background: var(--c-cream);
  color: var(--c-onyx);
  font-family: var(--font-body);
}

.skip-link {
  position: absolute;
  top: -100px;
  left: 0;
  z-index: 200;
  padding: var(--sp-sm) var(--sp-md);
  background: var(--c-onyx);
  color: var(--c-cream);
  text-decoration: none;
  border-radius: 0 0 var(--r-md) 0;
}
.skip-link:focus,
.skip-link:focus-visible {
  top: 0;
  outline: 3px solid var(--c-acid);
  outline-offset: 2px;
}

/* Mobile topbar */
.mobile-topbar {
  display: none;
  align-items: center;
  justify-content: space-between;
  padding: var(--sp-md) var(--sp-lg);
  background: var(--c-cream);
  border-bottom: 1px solid rgba(20, 20, 20, 0.06);
  position: sticky;
  top: 0;
  z-index: 50;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-sm);
  text-decoration: none;
  color: var(--c-onyx);
}
.brand:focus-visible {
  outline: 2px solid var(--c-acid-dark);
  outline-offset: 4px;
  border-radius: var(--r-sm);
}

.brand--compact {
  font-weight: 600;
}

.brand__mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--r-md);
  background: var(--c-onyx);
  color: var(--c-acid);
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-style: italic;
  letter-spacing: 0;
}

.brand__group {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}

.brand__name {
  font-family: var(--font-display);
  font-size: 1.4rem;
  font-weight: 500;
  letter-spacing: 0.16em;
}

.brand__tag {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: var(--c-gray-600);
}

.hamburger {
  width: 44px;
  height: 44px;
  border: 1px solid rgba(20, 20, 20, 0.10);
  background: transparent;
  border-radius: var(--r-md);
  display: inline-flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 5px;
  cursor: pointer;
}

.hamburger__line {
  display: block;
  width: 18px;
  height: 2px;
  background: var(--c-onyx);
  border-radius: 2px;
}

/* Sidebar */
.sidebar {
  background: var(--c-cream);
  border-right: 1px solid rgba(20, 20, 20, 0.06);
  padding: var(--sp-xl) var(--sp-lg);
  display: flex;
  flex-direction: column;
  gap: var(--sp-xl);
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
}

.sidebar__head {
  display: flex;
  align-items: center;
  gap: var(--sp-md);
}

.sidebar__nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: var(--sp-md);
  padding: 0.7rem 0.9rem;
  border-radius: var(--r-md);
  text-decoration: none;
  color: var(--c-gray-800);
  font-size: 0.9375rem;
  font-weight: 500;
  letter-spacing: -0.005em;
  transition:
    background var(--d-standard) var(--ease-out-expo),
    color var(--d-standard) var(--ease-out-expo);
}

.nav-link:hover {
  background: rgba(20, 20, 20, 0.05);
}

.nav-link--active,
.nav-link--active:hover {
  background: var(--c-onyx);
  color: var(--c-cream);
}

.nav-link__icon {
  display: inline-flex;
  width: 20px;
  font-family: var(--font-mono);
  color: var(--c-gray-400);
  font-size: 0.9rem;
}

.nav-link--active .nav-link__icon {
  color: var(--c-acid);
}

.sidebar__foot {
  display: flex;
  flex-direction: column;
  gap: var(--sp-md);
}

.switch-link {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-sm);
  font-size: 0.75rem;
  font-family: var(--font-mono);
  letter-spacing: 0.15em;
  text-transform: uppercase;
  text-decoration: none;
  color: var(--c-gray-800);
  padding: 0.55rem 0.9rem;
  background: var(--c-acid);
  border-radius: var(--r-pill);
  width: fit-content;
  font-weight: 500;
}

.switch-link:hover {
  background: var(--c-acid-dark);
}

.switch-link:focus-visible {
  outline: 2px solid var(--c-onyx);
  outline-offset: 3px;
}

.user-card {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: var(--sp-md);
  padding: var(--sp-md);
  background: #ffffff;
  border-radius: var(--r-lg);
  border: 1px solid rgba(20, 20, 20, 0.04);
}

.user-card__avatar {
  width: 40px;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--c-onyx);
  color: var(--c-acid);
  border-radius: var(--r-pill);
  font-family: var(--font-mono);
  font-weight: 600;
  font-size: 0.875rem;
}

.user-card__meta {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.user-card__name {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--c-onyx);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-card__email {
  margin: 0;
  font-size: 0.75rem;
  color: var(--c-gray-600);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-card__logout {
  width: 32px;
  height: 32px;
  border-radius: var(--r-pill);
  border: 1px solid rgba(20, 20, 20, 0.10);
  background: transparent;
  cursor: pointer;
  font-size: 1rem;
  font-family: var(--font-mono);
  color: var(--c-gray-800);
  transition: background var(--d-standard) var(--ease-out-expo),
    color var(--d-standard) var(--ease-out-expo);
}

.user-card__logout:hover {
  background: var(--c-onyx);
  color: var(--c-acid);
}

/* Backdrop */
.backdrop {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(20, 20, 20, 0.35);
  z-index: 80;
  backdrop-filter: blur(2px);
}

/* Main area */
.main-area {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.topbar {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--sp-lg);
  padding: var(--sp-2xl) var(--sp-2xl) var(--sp-lg);
  flex-wrap: wrap;
}

.topbar__eyebrow {
  margin: 0 0 var(--sp-xs);
  font-family: var(--font-mono);
  font-size: 0.625rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--c-gray-600);
}

.topbar__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(2.4rem, 4vw, 3.5rem);
  font-weight: 500;
  line-height: 1.05;
  letter-spacing: -0.015em;
  color: var(--c-onyx);
  max-width: 18ch;
}

.topbar__actions {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-sm);
}

.content {
  flex: 1;
  padding: var(--sp-lg) var(--sp-2xl) var(--sp-2xl);
  outline: none;
  min-width: 0;
}

/* Tablet */
@media (max-width: 1024px) {
  .user-shell {
    --sidebar-width: 232px;
  }
  .topbar {
    padding: var(--sp-xl) var(--sp-xl) var(--sp-lg);
  }
  .content {
    padding: var(--sp-lg) var(--sp-xl) var(--sp-xl);
  }
}

/* Mobile drawer */
@media (max-width: 768px) {
  .user-shell {
    grid-template-columns: 1fr;
  }

  .mobile-topbar {
    display: flex;
  }

  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: min(82vw, 320px);
    transform: translateX(-100%);
    transition: transform var(--d-standard) var(--ease-out-expo);
    box-shadow: 0 24px 64px rgba(20, 20, 20, 0.20);
    z-index: 100;
    border-right: none;
  }

  .sidebar[data-open='true'] {
    transform: translateX(0);
  }

  .backdrop {
    display: block;
  }

  .topbar {
    padding: var(--sp-lg) var(--sp-lg) var(--sp-md);
  }

  .content {
    padding: var(--sp-md) var(--sp-lg) var(--sp-2xl);
  }

  .topbar__title {
    font-size: clamp(2rem, 8vw, 2.8rem);
  }
}

@media (prefers-reduced-motion: reduce) {
  .sidebar,
  .nav-link,
  .switch-link,
  .user-card__logout {
    transition: none;
  }
}
</style>
