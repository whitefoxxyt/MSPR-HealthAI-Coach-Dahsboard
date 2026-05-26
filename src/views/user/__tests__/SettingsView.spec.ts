import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory, type Router } from 'vue-router'
import SettingsView from '../SettingsView.vue'

const AUTH_STORAGE_KEY = 'healthai.auth.session'

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function seedAuthSession() {
  localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({
      user: { id: 'u-1', username: 'arthur', email: 'arthur@test.dev', role: 'user' },
      tokens: {
        accessToken: 'jwt-test-token',
        refreshToken: 'refresh',
        expiresAt: '2099-01-01T00:00:00.000Z',
      },
    }),
  )
}

function createTestRouter(): Router {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: { template: '<div>home</div>' } },
      { path: '/parametres', name: 'settings', component: SettingsView },
    ],
  })
}

async function mountSettings() {
  const router = createTestRouter()
  await router.push('/parametres')
  await router.isReady()
  return mount(SettingsView, { global: { plugins: [createPinia(), router] } })
}

describe('SettingsView', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    setActivePinia(createPinia())
    seedAuthSession()
    fetchSpy = vi.spyOn(globalThis, 'fetch')
    fetchSpy.mockResolvedValue(
      jsonResponse({ preferred_llm: null, effective_llm: 'mistral' }),
    )
  })

  afterEach(() => {
    fetchSpy.mockRestore()
    localStorage.removeItem(AUTH_STORAGE_KEY)
  })

  it('rend la page dans UserLayout (brand HealthAI Coach visible)', async () => {
    const wrapper = await mountSettings()
    await flushPromises()

    expect(wrapper.text()).toContain('HealthAI Coach')
  })

  it('expose une section "Préférence IA" qui embarque le LLMSelector', async () => {
    const wrapper = await mountSettings()
    await flushPromises()

    expect(wrapper.text()).toMatch(/Préférence IA/i)
    expect(wrapper.find('.llm-selector').exists()).toBe(true)
  })

  it('utilise des attributs ARIA pour les sections', async () => {
    const wrapper = await mountSettings()
    await flushPromises()

    const sections = wrapper.findAll('section[aria-labelledby]')
    expect(sections.length).toBeGreaterThanOrEqual(1)
  })
})
