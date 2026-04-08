import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '@/views/DashboardView.vue'
import DataCleaningView from '@/views/DataCleaningView.vue'
import ValidationView from '@/views/ValidationView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: DashboardView,
      meta: {
        title: 'Dashboard - HealthAI Coach',
      },
    },
    {
      path: '/data-cleaning',
      name: 'data-cleaning',
      component: DataCleaningView,
      meta: {
        title: 'Nettoyage des données - HealthAI Coach',
      },
    },
    {
      path: '/validation',
      name: 'validation',
      component: ValidationView,
      meta: {
        title: 'Validation - HealthAI Coach',
      },
    },
  ],
})

// Mise à jour du titre de la page
router.afterEach((to) => {
  const title = to.meta.title as string | undefined
  if (title) {
    document.title = title
  }
})

export default router
