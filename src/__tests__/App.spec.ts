import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import App from '../App.vue'

const AUTH_STORAGE_KEY = 'healthai.auth.session'

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div>Auth page</div>' }, meta: { authPage: true } },
      { path: '/dashboard', component: { template: '<div>Dashboard page</div>' } },
      { path: '/data-cleaning', component: { template: '<div>Data cleaning page</div>' } },
      { path: '/validation', component: { template: '<div>Validation page</div>' } },
    ],
  })
}

describe('App', () => {
  beforeEach(() => {
    localStorage.removeItem(AUTH_STORAGE_KEY)
  })

  it('cache le layout dashboard sur la page auth', async () => {
    const router = createTestRouter()
    await router.push('/')
    await router.isReady()

    const wrapper = mount(App, {
      global: {
        plugins: [createPinia(), router],
      },
    })

    expect(wrapper.text()).toContain('Auth page')
    expect(wrapper.text()).not.toContain('Dashboard')
    expect(wrapper.text()).not.toContain('HealthAI Coach')
  })

  it('affiche le layout dashboard sur les pages internes', async () => {
    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({
        user: {
          id: 'admin-1',
          username: 'admin',
          email: 'admin@healthai.test',
          role: 'admin',
        },
        tokens: {
          accessToken: 'access-token-test',
          refreshToken: 'refresh-token-test',
          expiresAt: '2099-01-01T00:00:00.000Z',
        },
      }),
    )

    const router = createTestRouter()
    await router.push('/dashboard')
    await router.isReady()

    const wrapper = mount(App, {
      global: {
        plugins: [createPinia(), router],
      },
    })

    expect(wrapper.text()).toContain('HealthAI Coach')
    expect(wrapper.text()).toContain('Dashboard')
    expect(wrapper.text()).toContain('Déconnexion')
  })
})
