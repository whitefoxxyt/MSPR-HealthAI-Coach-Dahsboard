<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const showDashboardLayout = computed(() => !route.meta.authPage)
const currentUserLabel = computed(() => authStore.currentUser?.username || 'admin')

onMounted(() => {
  authStore.hydrateFromStorage()
})

async function handleLogout() {
  await authStore.logout()
  router.push({ name: 'auth' })
}
</script>

<template>
  <RouterView v-if="!showDashboardLayout" />

  <div v-else id="app">
    <a href="#main-content" class="skip-link">Aller au contenu principal</a>

    <nav class="main-nav" role="navigation" aria-label="Navigation principale">
      <div class="nav-container">
        <RouterLink to="/dashboard" class="nav-brand" aria-label="HealthAI Coach - Accueil">
          <span class="nav-brand__icon" aria-hidden="true">
            <font-awesome-icon :icon="['fas', 'heart-pulse']" />
          </span>
          <span class="nav-brand__text">HealthAI Coach</span>
        </RouterLink>

        <ul class="nav-menu" role="list">
          <li class="nav-item">
            <RouterLink to="/dashboard" class="nav-link" active-class="nav-link--active">
              <font-awesome-icon :icon="['fas', 'chart-line']" class="nav-link__icon" aria-hidden="true" />
              Dashboard
            </RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink to="/data-cleaning" class="nav-link" active-class="nav-link--active">
              <font-awesome-icon :icon="['fas', 'wand-magic-sparkles']" class="nav-link__icon" aria-hidden="true" />
              Nettoyage
            </RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink to="/validation" class="nav-link" active-class="nav-link--active">
              <font-awesome-icon :icon="['fas', 'shield-check']" class="nav-link__icon" aria-hidden="true" />
              Validation
            </RouterLink>
          </li>
        </ul>

        <div class="nav-actions">
          <span class="nav-user" aria-label="Utilisateur connecté : {{ currentUserLabel }}">{{ currentUserLabel }}</span>
          <button class="nav-logout" type="button" @click="handleLogout">Déconnexion</button>
        </div>
      </div>
    </nav>

    <main id="main-content" class="main-content" role="main" tabindex="-1">
      <RouterView />
    </main>

    <footer class="main-footer" role="contentinfo">
      <p class="footer-text">© 2026 HealthAI Coach — Dashboard d'administration</p>
    </footer>
  </div>
</template>

<style>
/* ── Design system tokens — Dark / Apple Health ── */
:root {
  /* Brand — Apple Health green */
  --c-brand:        #30d158;
  --c-brand-dark:   #25a244;
  --c-brand-light:  rgba(48, 209, 88, 0.30);
  --c-brand-xlight: rgba(48, 209, 88, 0.10);

  /* Energy accent — Apple orange */
  --c-energy:       #ff9f0a;
  --c-energy-light: rgba(255, 159, 10, 0.15);

  /* Info — Apple blue */
  --c-info:         #0a84ff;
  --c-info-light:   rgba(10, 132, 255, 0.15);

  /* Danger — Apple red */
  --c-danger:       #ff453a;
  --c-danger-light: rgba(255, 69, 58, 0.15);

  /* Neutrals — iOS dark system */
  --c-text:         #f2f2f7;
  --c-text-muted:   #8e8e93;
  --c-surface:      #1c1c1e;
  --c-surface-2:    #2c2c2e;
  --c-bg:           #000000;
  --c-border:       rgba(84, 84, 88, 0.50);

  /* Misc */
  --radius:         1rem;
  --shadow-sm:      0 2px 8px rgba(0, 0, 0, 0.50);
  --shadow-md:      0 8px 32px rgba(0, 0, 0, 0.65);

  /* Chart utility */
  --chart-grid:     rgba(84, 84, 88, 0.40);
  --chart-label:    #8e8e93;
}

/* ── Reset ── */
*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  line-height: 1.6;
  color: var(--c-text);
  background: var(--c-bg);
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* ── Skip link (RGAA 12.7) ── */
.skip-link {
  position: absolute;
  top: -100px;
  left: 0;
  z-index: 1000;
  padding: 0.75rem 1.25rem;
  background: var(--c-brand);
  color: #fff;
  font-weight: 700;
  text-decoration: none;
  border-radius: 0 0 var(--radius) 0;
  transition: top 0.15s ease;
}

.skip-link:focus,
.skip-link:focus-visible {
  top: 0;
  outline: 3px solid #fff;
  outline-offset: 2px;
}

/* ── Navigation ── */
.main-nav {
  background: rgba(28, 28, 30, 0.85);
  border-bottom: 1px solid var(--c-border);
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.05);
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
}

.nav-container {
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.875rem 0;
  text-decoration: none;
  color: var(--c-text);
  font-weight: 700;
  font-size: 1rem;
  letter-spacing: -0.015em;
  transition: opacity 0.2s;
  flex-shrink: 0;
}

.nav-brand:hover { opacity: 0.85; }

.nav-brand:focus-visible {
  outline: 2px solid var(--c-brand);
  outline-offset: 3px;
  border-radius: 4px;
}

.nav-brand__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  background: var(--c-brand-xlight);
  border-radius: 0.5rem;
  font-size: 1.125rem;
  line-height: 1;
  color: var(--c-brand);
}

.nav-menu {
  display: flex;
  gap: 0.25rem;
  list-style: none;
  margin: 0;
  padding: 0;
  flex: 1;
  justify-content: center;
}

.nav-item { margin: 0; }

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.875rem;
  text-decoration: none;
  color: var(--c-text-muted);
  font-weight: 500;
  font-size: 0.875rem;
  border-radius: 0.625rem;
  transition: background 0.15s, color 0.15s;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.06);
  color: var(--c-text);
}

.nav-link--active {
  background: var(--c-brand-xlight);
  color: var(--c-brand);
  font-weight: 600;
}

.nav-link:focus-visible {
  outline: 2px solid var(--c-brand);
  outline-offset: 2px;
}

/* ── Nav actions ── */
.nav-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

.nav-user {
  display: inline-flex;
  align-items: center;
  padding: 0.3rem 0.7rem;
  border-radius: 9999px;
  background: var(--c-brand-xlight);
  color: var(--c-brand);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.01em;
}

.nav-logout {
  border: 1px solid var(--c-border);
  background: transparent;
  color: var(--c-text-muted);
  border-radius: 0.625rem;
  padding: 0.375rem 0.75rem;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s, color 0.15s;
}

.nav-logout:hover {
  border-color: var(--c-danger);
  background: var(--c-danger-light);
  color: var(--c-danger);
}

.nav-logout:focus-visible {
  outline: 2px solid var(--c-brand);
  outline-offset: 2px;
}

/* ── Main content ── */
.main-content {
  flex: 1;
  background: var(--c-bg);
}

#main-content:focus { outline: none; }

/* ── Footer ── */
.main-footer {
  background: var(--c-surface);
  border-top: 1px solid var(--c-border);
  padding: 1rem 2rem;
  text-align: center;
}

.footer-text {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--c-text-muted);
}

/* ── Utility ── */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .nav-container {
    padding: 0 1rem;
    flex-direction: column;
    align-items: stretch;
    gap: 0;
  }

  .nav-brand {
    justify-content: center;
    padding: 0.875rem 0 0.5rem;
  }

  .nav-menu {
    justify-content: center;
    padding: 0.25rem 0;
  }

  .nav-actions {
    justify-content: space-between;
    padding: 0.625rem 0 0.875rem;
  }
}

@media print {
  .main-nav,
  .main-footer {
    display: none;
  }
}
</style>
