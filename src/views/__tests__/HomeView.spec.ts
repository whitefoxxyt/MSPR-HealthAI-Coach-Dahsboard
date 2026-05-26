import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import HomeView from '../HomeView.vue'
import { useAuthStore } from '@/stores/auth'

function createTestRouter(): Router {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: HomeView },
      { path: '/meal-analysis', name: 'meal-analysis', component: { template: '<div/>' } },
      { path: '/meal-plan', name: 'meal-plan', component: { template: '<div/>' } },
      { path: '/fitness-program', name: 'fitness-program', component: { template: '<div/>' } },
      { path: '/login', name: 'login', component: { template: '<div/>' } },
    ],
  })
}

async function mountHome(initialPath = '/') {
  const router = createTestRouter()
  await router.push(initialPath)
  await router.isReady()
  return {
    wrapper: mount(HomeView, {
      global: {
        plugins: [createPinia(), router],
        stubs: { UserLayout: { template: '<div><slot name="actions" /><slot /></div>' }, FontAwesomeIcon: true },
      },
    }),
    router,
  }
}

describe('HomeView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('rend les trois raccourcis (analyser, plan, programme)', async () => {
    const { wrapper } = await mountHome()
    const shortcuts = wrapper.findAll('.shortcut')
    expect(shortcuts).toHaveLength(3)
    expect(wrapper.text()).toContain('Analyser un repas')
    expect(wrapper.text()).toContain('Générer un plan')
    expect(wrapper.text()).toContain('Programme fitness')
  })

  it('rend les 3 cards d activités vides', async () => {
    const { wrapper } = await mountHome()
    expect(wrapper.text()).toContain('Dernière analyse')
    expect(wrapper.text()).toContain('Dernier plan')
    expect(wrapper.text()).toContain('Dernier programme')
    expect(wrapper.text()).toMatch(/aucune analyse/i)
    expect(wrapper.text()).toMatch(/aucun plan/i)
    expect(wrapper.text()).toMatch(/aucun programme/i)
  })

  it('utilise le prénom de l utilisateur dans le lead', async () => {
    const { wrapper } = await mountHome()
    const store = useAuthStore()
    store.session = {
      user: { id: '1', username: 'arthur.poncin', email: 'a@b.c', role: 'admin' },
      tokens: { accessToken: 't', refreshToken: 'r', expiresAt: '2099-01-01T00:00:00.000Z' },
    }
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toMatch(/Hello\s*arthur/i)
  })

  it('utilise "à toi" si pas de username', async () => {
    const { wrapper } = await mountHome()
    expect(wrapper.text()).toMatch(/Hello\s*à toi/i)
  })

  it("affiche la bannière 'admin denied' si query.denied=admin", async () => {
    const { wrapper } = await mountHome('/?denied=admin')
    expect(wrapper.find('.denied-banner').exists()).toBe(true)
    expect(wrapper.text()).toMatch(/espace admin réservé|reserve/i)
  })

  it("ne montre pas la bannière si query.denied != admin", async () => {
    const { wrapper } = await mountHome('/')
    expect(wrapper.find('.denied-banner').exists()).toBe(false)
  })

  it("bouton de fermeture de la bannière retire 'denied' de la query", async () => {
    const { wrapper, router } = await mountHome('/?denied=admin')
    await wrapper.find('.denied-banner__close').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.query.denied).toBeUndefined()
    expect(wrapper.find('.denied-banner').exists()).toBe(false)
  })

  it("les raccourcis ont les liens vers les bonnes routes", async () => {
    const { wrapper } = await mountHome()
    const links = wrapper.findAll('.shortcut')
    expect((links[0]!.attributes('href') ?? links[0]!.attributes('to'))).toMatch(/meal-analysis/)
    expect((links[1]!.attributes('href') ?? links[1]!.attributes('to'))).toMatch(/meal-plan/)
    expect((links[2]!.attributes('href') ?? links[2]!.attributes('to'))).toMatch(/fitness-program/)
  })

  it("le raccourci 'analyser' a le data-variant acid", async () => {
    const { wrapper } = await mountHome()
    const shortcuts = wrapper.findAll('.shortcut')
    expect(shortcuts[0]!.attributes('data-variant')).toBe('acid')
    expect(shortcuts[1]!.attributes('data-variant')).toBe('default')
    expect(shortcuts[2]!.attributes('data-variant')).toBe('default')
  })
})
