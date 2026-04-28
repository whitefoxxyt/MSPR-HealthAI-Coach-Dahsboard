<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const currentUserLabel = computed(() => authStore.currentUser?.username || 'admin')

function handleLogout() {
  authStore.logout()
  router.push({ name: 'auth' })
}
</script>

<template>
  <div class="app-shell">
    <nav class="main-nav" role="navigation" aria-label="Navigation administration">
      <div class="nav-container">
        <RouterLink to="/admin/dashboard" class="nav-brand">
          <span class="nav-brand__icon" aria-hidden="true">❤️</span>
          <span class="nav-brand__text">HealthAI Coach</span>
        </RouterLink>

        <ul class="nav-menu">
          <li class="nav-item">
            <RouterLink to="/admin/dashboard" class="nav-link" active-class="nav-link--active">
              📊 Dashboard
            </RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink to="/admin/data-cleaning" class="nav-link" active-class="nav-link--active">
              🧹 Nettoyage
            </RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink to="/admin/validation" class="nav-link" active-class="nav-link--active">
              ✓ Validation
            </RouterLink>
          </li>
        </ul>

        <div class="nav-actions">
          <span class="nav-user">{{ currentUserLabel }}</span>
          <button class="nav-logout" type="button" @click="handleLogout">Déconnexion</button>
        </div>
      </div>
    </nav>

    <main class="main-content" role="main">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  background: #f9fafb;
}

.main-nav {
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-container {
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 0;
  text-decoration: none;
  color: #111827;
  font-weight: 700;
}

.nav-brand__icon {
  font-size: 1.5rem;
}

.nav-menu {
  display: flex;
  gap: 0.5rem;
  list-style: none;
  margin: 0;
  padding: 0;
  flex: 1;
  justify-content: center;
}

.nav-link {
  display: block;
  padding: 0.75rem 1.25rem;
  text-decoration: none;
  color: #6b7280;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
}

.nav-link:hover {
  background: #f3f4f6;
  color: #111827;
}

.nav-link--active {
  background: #eff6ff;
  color: #1d4ed8;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.nav-user {
  display: inline-flex;
  align-items: center;
  padding: 0.4rem 0.65rem;
  border-radius: 9999px;
  background: #eff6ff;
  color: #1e40af;
  font-size: 0.75rem;
  font-weight: 700;
}

.nav-logout {
  border: 1px solid #d1d5db;
  background: #ffffff;
  color: #374151;
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
}

.nav-logout:hover {
  border-color: #fca5a5;
  background: #fef2f2;
  color: #b91c1c;
}

.nav-link:focus-visible,
.nav-brand:focus-visible,
.nav-logout:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

@media (max-width: 768px) {
  .nav-container {
    padding: 0 1rem;
    flex-direction: column;
    align-items: stretch;
  }

  .nav-menu {
    flex-direction: column;
  }

  .nav-actions {
    justify-content: space-between;
    padding-bottom: 0.75rem;
  }
}
</style>
