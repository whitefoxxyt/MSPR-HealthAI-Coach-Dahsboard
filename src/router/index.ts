import { createRouter, createWebHistory, type RouteLocationNormalized } from 'vue-router'
import { authSessionManager } from '@/services/auth'
import { useAuthStore } from '@/stores/auth'
import { isCurrentUserAdmin } from '@/utils/auth-role'
import AdminLayout from '@/layouts/AdminLayout.vue'
import AuthView from '@/views/AuthView.vue'
import DashboardView from '@/views/DashboardView.vue'
import DataCleaningView from '@/views/DataCleaningView.vue'
import FitnessProgramView from '@/views/FitnessProgramView.vue'
import HomeView from '@/views/HomeView.vue'
import MealAnalysisView from '@/views/MealAnalysisView.vue'
import MealPlanView from '@/views/MealPlanView.vue'
import ProfileView from '@/views/ProfileView.vue'
import ValidationView from '@/views/ValidationView.vue'
import SettingsView from '@/views/user/SettingsView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // Public
    {
      path: '/login',
      name: 'login',
      component: AuthView,
      meta: {
        title: 'Connexion — VITAL',
        guestOnly: true,
        authPage: true,
      },
    },

    // Legacy redirects (anciennes URLs admin)
    { path: '/dashboard', redirect: { name: 'admin-dashboard' } },
    { path: '/data-cleaning', redirect: { name: 'admin-data-cleaning' } },
    { path: '/validation', redirect: { name: 'admin-validation' } },

    // Admin (AdminLayout)
    {
      path: '/admin',
      component: AdminLayout,
      meta: { requireAuth: true, requireAdmin: true },
      children: [
        {
          path: '',
          name: 'admin-dashboard',
          component: DashboardView,
          meta: { title: 'Dashboard — Admin' },
        },
        {
          path: 'data-cleaning',
          name: 'admin-data-cleaning',
          component: DataCleaningView,
          meta: { title: 'Nettoyage des données — Admin' },
        },
        {
          path: 'validation',
          name: 'admin-validation',
          component: ValidationView,
          meta: { title: 'Validation — Admin' },
        },
      ],
    },

    // User
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { requireAuth: true, title: 'VITAL — Accueil' },
    },
    {
      path: '/meal-analysis',
      name: 'meal-analysis',
      component: MealAnalysisView,
      meta: { requireAuth: true, title: 'Analyse repas — VITAL' },
    },
    {
      path: '/profil',
      name: 'profile',
      component: ProfileView,
      meta: { requireAuth: true, title: 'Profil & objectifs — VITAL' },
    },
    {
      path: '/meal-plan',
      name: 'meal-plan',
      component: MealPlanView,
      meta: { requireAuth: true, title: 'Plan repas — VITAL' },
    },
    {
      path: '/parametres',
      name: 'settings',
      component: SettingsView,
      meta: { requireAuth: true, title: 'Paramètres — VITAL' },
    },
    {
      path: '/fitness-program',
      name: 'fitness-program',
      component: FitnessProgramView,
      meta: { requireAuth: true, title: 'Programme fitness — VITAL' },
    },

    // 404 → login
    {
      path: '/:pathMatch(.*)*',
      redirect: { name: 'login' },
    },
  ],
})

function defaultRouteForRole(): RouteLocationNormalized | { name: string } {
  return isCurrentUserAdmin() ? { name: 'admin-dashboard' } : { name: 'home' }
}

router.beforeEach(async (to) => {
  const isAuthenticated = authSessionManager.hasValidSession()

  if (isAuthenticated) {
    if (to.meta.guestOnly) return defaultRouteForRole()
    if (to.meta.requireAdmin && !isCurrentUserAdmin()) {
      return { name: 'home', query: { denied: 'admin' } }
    }
    return true
  }

  // Tente de bootstrapper depuis le cookie Better Auth (post-verification email)
  if (to.meta.requireAuth || to.meta.guestOnly) {
    const store = useAuthStore()
    const bootstrapped = await store.bootstrapFromSession()
    if (bootstrapped) {
      if (to.meta.guestOnly) return defaultRouteForRole()
      if (to.meta.requireAdmin && !isCurrentUserAdmin()) {
        return { name: 'home', query: { denied: 'admin' } }
      }
      return true
    }
  }

  if (to.meta.requireAuth) {
    return { name: 'login' }
  }

  return true
})

router.afterEach((to) => {
  const title = to.meta.title as string | undefined
  if (title) {
    document.title = title
  }
})

export default router
