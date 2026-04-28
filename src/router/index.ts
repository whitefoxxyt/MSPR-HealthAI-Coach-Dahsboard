import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import LandingView from '@/views/LandingView.vue'
import AuthView from '@/views/AuthView.vue'
import DashboardView from '@/views/DashboardView.vue'
import DataCleaningView from '@/views/DataCleaningView.vue'
import ValidationView from '@/views/ValidationView.vue'
import UserDashboardView from '@/views/user/UserDashboardView.vue'
import NutritionView from '@/views/user/NutritionView.vue'
import ActivityView from '@/views/user/ActivityView.vue'
import ProfileView from '@/views/user/ProfileView.vue'
import AdminLayout from '@/layouts/AdminLayout.vue'
import UserLayout from '@/layouts/UserLayout.vue'

type RouteRole = 'admin' | 'user'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    requireAuth?: boolean
    guestOnly?: boolean
    authPage?: boolean
    role?: RouteRole
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'landing',
      component: LandingView,
      meta: { title: 'Accueil - HealthAI Coach' },
    },
    {
      path: '/auth',
      name: 'auth',
      component: AuthView,
      meta: {
        title: 'Connexion - HealthAI Coach',
        guestOnly: true,
        authPage: true,
      },
    },
    {
      path: '/',
      component: UserLayout,
      meta: { requireAuth: true, role: 'user' },
      children: [
        {
          path: 'dashboard',
          name: 'user-dashboard',
          component: UserDashboardView,
          meta: { title: 'Dashboard utilisateur - HealthAI Coach', requireAuth: true, role: 'user' },
        },
        {
          path: 'nutrition',
          name: 'nutrition',
          component: NutritionView,
          meta: { title: 'Nutrition - HealthAI Coach', requireAuth: true, role: 'user' },
        },
        {
          path: 'activity',
          name: 'activity',
          component: ActivityView,
          meta: { title: 'Activité - HealthAI Coach', requireAuth: true, role: 'user' },
        },
        {
          path: 'profile',
          name: 'profile',
          component: ProfileView,
          meta: { title: 'Profil - HealthAI Coach', requireAuth: true, role: 'user' },
        },
      ],
    },
    {
      path: '/admin',
      component: AdminLayout,
      meta: { requireAuth: true, role: 'admin' },
      children: [
        {
          path: '',
          redirect: '/admin/dashboard',
        },
        {
          path: 'dashboard',
          name: 'admin-dashboard',
          component: DashboardView,
          meta: { title: 'Dashboard admin - HealthAI Coach', requireAuth: true, role: 'admin' },
        },
        {
          path: 'data-cleaning',
          name: 'admin-data-cleaning',
          component: DataCleaningView,
          meta: { title: 'Nettoyage des données - HealthAI Coach', requireAuth: true, role: 'admin' },
        },
        {
          path: 'validation',
          name: 'admin-validation',
          component: ValidationView,
          meta: { title: 'Validation - HealthAI Coach', requireAuth: true, role: 'admin' },
        },
      ],
    },
    { path: '/data-cleaning', redirect: '/admin/data-cleaning' },
    { path: '/validation', redirect: '/admin/validation' },
    { path: '/dashboard-admin', redirect: '/admin/dashboard' },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()
  authStore.hydrateFromStorage()

  if (authStore.session && authStore.isSessionExpired) {
    try {
      await authStore.refreshSession()
    } catch {
      if (to.meta.requireAuth) {
        return { name: 'auth', query: { redirect: to.fullPath } }
      }
    }
  }

  const isAuthenticated = authStore.isAuthenticated

  if (to.meta.requireAuth && !isAuthenticated) {
    return { name: 'auth', query: { redirect: to.fullPath } }
  }

  if (to.meta.guestOnly && isAuthenticated) {
    return authStore.defaultHomePath
  }

  if (isAuthenticated && to.meta.role === 'admin' && !authStore.isAdmin) {
    return '/dashboard'
  }

  if (isAuthenticated && to.meta.role === 'user' && authStore.isAdmin) {
    return '/admin/dashboard'
  }

  return true
})

router.afterEach((to) => {
  if (to.meta.title) {
    document.title = to.meta.title
  }
})

export default router
