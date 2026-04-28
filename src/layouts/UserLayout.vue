<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const router = useRouter()

const currentUserLabel = computed(() => authStore.currentUser?.username || 'utilisateur')

function handleLogout() {
  authStore.logout()
  router.push({ name: 'auth' })
}
</script>

<template>
  <div class="app-shell">
    <nav class="main-nav" role="navigation" aria-label="Navigation utilisateur">
      <div class="nav-container">
        <RouterLink to="/dashboard" class="nav-brand">
          <span class="nav-brand__icon" aria-hidden="true">💪</span>
          <span class="nav-brand__text">HealthAI Coach</span>
        </RouterLink>

        <ul class="nav-menu">
          <li><RouterLink to="/dashboard" class="nav-link" active-class="nav-link--active">Dashboard</RouterLink></li>
          <li><RouterLink to="/nutrition" class="nav-link" active-class="nav-link--active">Nutrition</RouterLink></li>
          <li><RouterLink to="/activity" class="nav-link" active-class="nav-link--active">Activité</RouterLink></li>
          <li><RouterLink to="/profile" class="nav-link" active-class="nav-link--active">Profil</RouterLink></li>
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
}

.nav-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0.5rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.nav-brand {
  text-decoration: none;
  color: #111827;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
}

.nav-menu {
  list-style: none;
  display: flex;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
}

.nav-link {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  padding: 0 0.75rem;
  text-decoration: none;
  color: #4b5563;
  border-radius: 8px;
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
  display: inline-flex;
  gap: 0.5rem;
  align-items: center;
}

.nav-user {
  padding: 0.4rem 0.65rem;
  border-radius: 9999px;
  background: #eff6ff;
  color: #1e40af;
  font-size: 0.75rem;
  font-weight: 700;
}

.nav-logout {
  min-height: 44px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #ffffff;
  color: #374151;
  padding: 0 0.75rem;
  font-weight: 600;
}

.nav-link:focus-visible,
.nav-brand:focus-visible,
.nav-logout:focus-visible {
  outline: 2px solid #93c5fd;
  outline-offset: 2px;
}

@media (max-width: 768px) {
  .nav-container {
    flex-direction: column;
    align-items: stretch;
  }

  .nav-menu {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .nav-link {
    justify-content: center;
  }

  .nav-actions {
    justify-content: space-between;
  }
}
</style>
