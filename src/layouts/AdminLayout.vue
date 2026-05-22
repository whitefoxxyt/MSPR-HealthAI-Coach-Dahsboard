<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const drawerOpen = ref(false)

watch(() => route.fullPath, () => (drawerOpen.value = false))

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') drawerOpen.value = false
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))

const navItems = [
  { name: 'admin-dashboard', to: '/admin', icon: '◈', label: 'Dashboard' },
  { name: 'admin-data-cleaning', to: '/admin/data-cleaning', icon: '◇', label: 'Data cleaning' },
  { name: 'admin-validation', to: '/admin/validation', icon: '◉', label: 'Validation' },
]

const currentUserLabel = computed(() => authStore.currentUser?.username || 'admin')
const initials = computed(() => currentUserLabel.value.charAt(0).toUpperCase())

async function handleLogout() {
  await authStore.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="admin-shell">
    <a href="#admin-main" class="skip-link">Aller au contenu principal</a>

    <!-- Mobile topbar -->
    <header class="mobile-topbar" role="banner">
      <RouterLink to="/admin" class="brand brand--compact" aria-label="HealthAI Admin">
        <span class="brand__mark" aria-hidden="true">H</span>
        <span class="brand__name">HealthAI Admin</span>
      </RouterLink>
      <button
        type="button"
        class="hamburger"
        :aria-expanded="drawerOpen"
        aria-controls="admin-sidebar"
        aria-label="Ouvrir le menu"
        @click="drawerOpen = !drawerOpen"
      >
        <span class="hamburger__line" />
        <span class="hamburger__line" />
        <span class="hamburger__line" />
      </button>
    </header>

    <aside
      id="admin-sidebar"
      class="sidebar"
      :data-open="drawerOpen ? 'true' : 'false'"
      aria-label="Navigation admin"
    >
      <div class="sidebar__head">
        <RouterLink to="/admin" class="brand" aria-label="HealthAI Coach — admin">
          <span class="brand__mark" aria-hidden="true">H</span>
          <div class="brand__group">
            <span class="brand__name">HealthAI</span>
            <span class="brand__tag">Espace administration</span>
          </div>
        </RouterLink>
      </div>

      <nav class="sidebar__nav" aria-label="Sections admin">
        <RouterLink
          v-for="item in navItems"
          :key="item.name"
          :to="item.to"
          class="nav-link"
          active-class="nav-link--active"
          :exact="item.to === '/admin'"
        >
          <span class="nav-link__icon" aria-hidden="true">{{ item.icon }}</span>
          <span class="nav-link__label">{{ item.label }}</span>
        </RouterLink>
      </nav>

      <div class="sidebar__foot">
        <RouterLink to="/" class="switch-link" data-switch-user>
          <span aria-hidden="true">⇆</span>
          Vue utilisateur
        </RouterLink>

        <div class="user-card">
          <div class="user-card__avatar" aria-hidden="true">{{ initials }}</div>
          <div class="user-card__meta">
            <p class="user-card__name">{{ currentUserLabel }}</p>
            <p class="user-card__role">Administrateur</p>
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

    <div
      v-if="drawerOpen"
      class="backdrop"
      aria-hidden="true"
      @click="drawerOpen = false"
    />

    <main id="admin-main" class="admin-main" tabindex="-1">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.admin-shell {
  --sidebar-width: 256px;

  min-height: 100vh;
  display: grid;
  grid-template-columns: var(--sidebar-width) 1fr;
  background: var(--c-bg);
  color: var(--c-text);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.skip-link {
  position: absolute;
  top: -100px;
  left: 0;
  z-index: 200;
  padding: 0.75rem 1.25rem;
  background: var(--c-brand);
  color: #000;
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

.mobile-topbar {
  display: none;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1rem;
  background: rgba(28, 28, 30, 0.92);
  border-bottom: 1px solid var(--c-border);
  position: sticky;
  top: 0;
  z-index: 50;
  backdrop-filter: blur(20px) saturate(180%);
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 0.625rem;
  text-decoration: none;
  color: var(--c-text);
}

.brand--compact .brand__name {
  font-size: 0.9375rem;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.brand__mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: var(--c-brand-xlight);
  border-radius: 0.5rem;
  font-size: 0.9375rem;
  font-weight: 800;
  color: var(--c-brand);
}

.brand__group {
  display: flex;
  flex-direction: column;
  line-height: 1.15;
}

.brand__name {
  font-weight: 700;
  font-size: 0.9375rem;
  letter-spacing: -0.005em;
}

.brand__tag {
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--c-text-muted);
}

.hamburger {
  width: 40px;
  height: 40px;
  border: 1px solid var(--c-border);
  background: transparent;
  border-radius: 0.5rem;
  display: inline-flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 5px;
  cursor: pointer;
}

.hamburger__line {
  display: block;
  width: 16px;
  height: 2px;
  background: var(--c-text);
  border-radius: 2px;
}

.sidebar {
  background: rgba(28, 28, 30, 0.85);
  border-right: 1px solid var(--c-border);
  padding: 1.5rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
  backdrop-filter: blur(20px) saturate(180%);
}

.sidebar__head {
  padding: 0 0.25rem 0.5rem;
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
  gap: 0.625rem;
  padding: 0.6rem 0.875rem;
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

.nav-link__icon {
  display: inline-flex;
  width: 18px;
  color: currentColor;
  font-size: 0.875rem;
}

.sidebar__foot {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.switch-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.6875rem;
  text-decoration: none;
  color: var(--c-text);
  padding: 0.45rem 0.75rem;
  background: var(--c-brand);
  border-radius: 9999px;
  width: fit-content;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #000;
}

.switch-link:hover {
  background: var(--c-brand-dark);
  color: #fff;
}

.switch-link:focus-visible {
  outline: 2px solid var(--c-brand);
  outline-offset: 2px;
}

.user-card {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 0.625rem;
  padding: 0.625rem;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: 0.75rem;
}

.user-card__avatar {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--c-brand-xlight);
  color: var(--c-brand);
  border-radius: 9999px;
  font-weight: 700;
  font-size: 0.8125rem;
}

.user-card__meta {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.user-card__name {
  margin: 0;
  font-size: 0.8125rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-card__role {
  margin: 0;
  font-size: 0.6875rem;
  color: var(--c-text-muted);
}

.user-card__logout {
  width: 28px;
  height: 28px;
  border-radius: 9999px;
  border: 1px solid var(--c-border);
  background: transparent;
  cursor: pointer;
  color: var(--c-text-muted);
  font-size: 0.875rem;
  transition: background 0.15s, color 0.15s;
}

.user-card__logout:hover {
  background: var(--c-danger-light);
  color: var(--c-danger);
}

.backdrop {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  z-index: 80;
  backdrop-filter: blur(2px);
}

.admin-main {
  min-width: 0;
  background: var(--c-bg);
  outline: none;
}

@media (max-width: 1024px) {
  .admin-shell {
    --sidebar-width: 224px;
  }
}

@media (max-width: 768px) {
  .admin-shell {
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
    transition: transform 0.25s ease;
    box-shadow: 0 24px 64px rgba(0, 0, 0, 0.55);
    z-index: 100;
  }
  .sidebar[data-open='true'] {
    transform: translateX(0);
  }
  .backdrop {
    display: block;
  }
}

@media (prefers-reduced-motion: reduce) {
  .sidebar,
  .nav-link {
    transition: none;
  }
}
</style>
