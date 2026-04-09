import { createRouter, createWebHistory } from 'vue-router'
import { authSessionManager } from '@/services/auth'
import AuthView from '@/views/AuthView.vue'
import DashboardView from '@/views/DashboardView.vue'
import DataCleaningView from '@/views/DataCleaningView.vue'
import ValidationView from '@/views/ValidationView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'auth',
      component: AuthView,
      meta: {
        title: 'Connexion - HealthAI Coach',
        guestOnly: true,
        authPage: true,
      },
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
      meta: {
        title: 'Dashboard - HealthAI Coach',
        requireAuth: true,
      },
    },
    {
      path: '/data-cleaning',
      name: 'data-cleaning',
      component: DataCleaningView,
      meta: {
        title: 'Nettoyage des données - HealthAI Coach',
        requireAuth: true,
      },
    },
    {
      path: '/validation',
      name: 'validation',
      component: ValidationView,
      meta: {
        title: 'Validation - HealthAI Coach',
        requireAuth: true,
      },
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

router.beforeEach((to) => {
  const isAuthenticated = authSessionManager.hasValidSession()

  if (to.meta.requireAuth && !isAuthenticated) {
    return { name: 'auth' }
  }

  if (to.meta.guestOnly && isAuthenticated) {
    return { name: 'dashboard' }
  }

  return true
})

// Mise à jour du titre de la page
router.afterEach((to) => {
  const title = to.meta.title as string | undefined
  if (title) {
    document.title = title
  }
})

export default router
