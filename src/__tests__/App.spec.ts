import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import App from '../App.vue'
import AdminLayout from '@/layouts/AdminLayout.vue'
import UserLayout from '@/layouts/UserLayout.vue'

const AUTH_STORAGE_KEY = 'healthai.auth.session'

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/login',
        name: 'login',
        component: { template: '<div data-testid="login">Connexion à VITAL</div>' },
        meta: { authPage: true },
      },
      {
        path: '/',
        name: 'home',
        component: {
          components: { UserLayout },
          template: '<UserLayout title="Accueil"><div data-testid="home">Home content</div></UserLayout>',
        },
      },
      {
        path: '/admin',
        component: AdminLayout,
        children: [
          {
            path: '',
            name: 'admin-dashboard',
            component: { template: '<div data-testid="admin-dashboard">Dashboard admin content</div>' },
          },
        ],
      },
    ],
  })
}

describe('App', () => {
  beforeEach(() => {
    localStorage.removeItem(AUTH_STORAGE_KEY)
  })

  it('shows only the auth view on /login (no admin chrome)', async () => {
    const router = createTestRouter()
    await router.push('/login')
    await router.isReady()

    const wrapper = mount(App, { global: { plugins: [createPinia(), router] } })
    await flushPromises()

    expect(wrapper.text()).toContain('Connexion à VITAL')
    expect(wrapper.text()).not.toContain('HealthAI Admin')
    expect(wrapper.text()).not.toContain('Espace administration')
  })

  it('wraps admin routes in the AdminLayout (sidebar + brand visible)', async () => {
    const router = createTestRouter()
    await router.push('/admin')
    await router.isReady()

    const wrapper = mount(App, { global: { plugins: [createPinia(), router] } })
    await flushPromises()

    expect(wrapper.text()).toContain('Dashboard admin content')
    expect(wrapper.text()).toContain('HealthAI')
    expect(wrapper.text()).toContain('Espace administration')
  })

  it('wraps user routes in the UserLayout (VITAL brand visible)', async () => {
    const router = createTestRouter()
    await router.push('/')
    await router.isReady()

    const wrapper = mount(App, { global: { plugins: [createPinia(), router] } })
    await flushPromises()

    expect(wrapper.text()).toContain('Home content')
    expect(wrapper.text()).toContain('VITAL')
  })
})
