import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import AuthView from '../AuthView.vue'
import { useAuthStore } from '@/stores/auth'
import * as authRole from '@/utils/auth-role'

function createTestRouter(): Router {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/login', name: 'login', component: AuthView },
      { path: '/', name: 'home', component: { template: '<div />' } },
      { path: '/admin', name: 'admin-dashboard', component: { template: '<div />' } },
    ],
  })
}

async function mountView() {
  const router = createTestRouter()
  await router.push('/login')
  await router.isReady()
  const pinia = createPinia()
  const wrapper = mount(AuthView, {
    global: { plugins: [pinia, router] },
  })
  return { wrapper, router }
}

describe('AuthView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('rend par défaut le formulaire de connexion', async () => {
    const { wrapper } = await mountView()
    expect(wrapper.find('input#login-email').exists()).toBe(true)
    expect(wrapper.find('input#login-password').exists()).toBe(true)
    expect(wrapper.text()).toMatch(/bon retour/i)
  })

  it('bascule vers le formulaire d inscription via l onglet', async () => {
    const { wrapper } = await mountView()
    const tabs = wrapper.findAll('.auth-tab')
    await tabs[1]!.trigger('click')
    expect(wrapper.find('input#register-name').exists()).toBe(true)
    expect(wrapper.find('input#register-email').exists()).toBe(true)
    expect(wrapper.find('input#register-confirm-password').exists()).toBe(true)
    expect(wrapper.text()).toMatch(/crée ton compte|cree ton compte/i)
  })

  it('bascule vers le formulaire mot de passe oublié et retour', async () => {
    const { wrapper } = await mountView()
    await wrapper.find('button.inline-link').trigger('click')
    expect(wrapper.find('input#forgot-email').exists()).toBe(true)
    expect(wrapper.text()).toMatch(/mot de passe oublié|mot de passe oublie/i)

    await wrapper.find('button.inline-link').trigger('click')
    expect(wrapper.find('input#login-email').exists()).toBe(true)
  })

  it('submit login: succès, redirige vers home si non admin', async () => {
    const { wrapper, router } = await mountView()
    const pushSpy = vi.spyOn(router, 'push')
    const store = useAuthStore()
    const loginSpy = vi.spyOn(store, 'login').mockResolvedValue(undefined)
    vi.spyOn(authRole, 'isCurrentUserAdmin').mockReturnValue(false)

    await wrapper.find('input#login-email').setValue('a@b.c')
    await wrapper.find('input#login-password').setValue('password')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(loginSpy).toHaveBeenCalledWith('a@b.c', 'password')
    expect(pushSpy).toHaveBeenCalledWith({ name: 'home' })
  })

  it('submit login: redirige vers admin-dashboard si admin', async () => {
    const { wrapper, router } = await mountView()
    const pushSpy = vi.spyOn(router, 'push')
    const store = useAuthStore()
    vi.spyOn(store, 'login').mockResolvedValue(undefined)
    vi.spyOn(authRole, 'isCurrentUserAdmin').mockReturnValue(true)

    await wrapper.find('input#login-email').setValue('admin@a.b')
    await wrapper.find('input#login-password').setValue('password')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(pushSpy).toHaveBeenCalledWith({ name: 'admin-dashboard' })
  })

  it('submit login: échec — affiche le message d erreur du throw', async () => {
    const { wrapper } = await mountView()
    const store = useAuthStore()
    vi.spyOn(store, 'login').mockRejectedValue(new Error('Wrong creds'))

    await wrapper.find('input#login-email').setValue('a@b.c')
    await wrapper.find('input#login-password').setValue('bad')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.find('.alert-error').text()).toContain('Wrong creds')
  })

  it('submit login: erreur non-Error — message par défaut', async () => {
    const { wrapper } = await mountView()
    const store = useAuthStore()
    vi.spyOn(store, 'login').mockRejectedValue('weird')

    await wrapper.find('input#login-email').setValue('a@b.c')
    await wrapper.find('input#login-password').setValue('bad')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.find('.alert-error').text()).toMatch(/erreur lors de la connexion/i)
  })

  it('submit register: refuse si les mots de passe ne correspondent pas', async () => {
    const { wrapper } = await mountView()
    const store = useAuthStore()
    const registerSpy = vi.spyOn(store, 'register').mockResolvedValue(undefined)

    await wrapper.findAll('.auth-tab')[1]!.trigger('click')
    await wrapper.find('input#register-name').setValue('Arthur')
    await wrapper.find('input#register-email').setValue('a@b.c')
    await wrapper.find('input#register-password').setValue('password')
    await wrapper.find('input#register-confirm-password').setValue('different')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(registerSpy).not.toHaveBeenCalled()
    expect(wrapper.find('.alert-error').text()).toMatch(/ne correspondent pas/i)
  })

  it('submit register: succès — bascule sur le formulaire login', async () => {
    const { wrapper } = await mountView()
    const store = useAuthStore()
    vi.spyOn(store, 'register').mockResolvedValue(undefined)

    await wrapper.findAll('.auth-tab')[1]!.trigger('click')
    await wrapper.find('input#register-name').setValue('Arthur')
    await wrapper.find('input#register-email').setValue('a@b.c')
    await wrapper.find('input#register-password').setValue('password')
    await wrapper.find('input#register-confirm-password').setValue('password')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.find('input#login-email').exists()).toBe(true)
  })

  it('submit register: erreur — affiche le message', async () => {
    const { wrapper } = await mountView()
    const store = useAuthStore()
    vi.spyOn(store, 'register').mockRejectedValue(new Error('Email taken'))

    await wrapper.findAll('.auth-tab')[1]!.trigger('click')
    await wrapper.find('input#register-name').setValue('A')
    await wrapper.find('input#register-email').setValue('a@b.c')
    await wrapper.find('input#register-password').setValue('password')
    await wrapper.find('input#register-confirm-password').setValue('password')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.find('.alert-error').text()).toContain('Email taken')
  })

  it('submit register: erreur non-Error — message par défaut', async () => {
    const { wrapper } = await mountView()
    const store = useAuthStore()
    vi.spyOn(store, 'register').mockRejectedValue('boom')

    await wrapper.findAll('.auth-tab')[1]!.trigger('click')
    await wrapper.find('input#register-name').setValue('A')
    await wrapper.find('input#register-email').setValue('a@b.c')
    await wrapper.find('input#register-password').setValue('password')
    await wrapper.find('input#register-confirm-password').setValue('password')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.find('.alert-error').text()).toMatch(/inscription/i)
  })

  it('submit forgot: succès — appelle requestPasswordReset', async () => {
    const { wrapper } = await mountView()
    const store = useAuthStore()
    const spy = vi.spyOn(store, 'requestPasswordReset').mockResolvedValue(undefined)

    await wrapper.find('button.inline-link').trigger('click')
    await wrapper.find('input#forgot-email').setValue('a@b.c')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(spy).toHaveBeenCalledWith('a@b.c')
  })

  it('submit forgot: erreur — affiche le message', async () => {
    const { wrapper } = await mountView()
    const store = useAuthStore()
    vi.spyOn(store, 'requestPasswordReset').mockRejectedValue(new Error('SMTP down'))

    await wrapper.find('button.inline-link').trigger('click')
    await wrapper.find('input#forgot-email').setValue('a@b.c')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.find('.alert-error').text()).toContain('SMTP down')
  })

  it('submit forgot: erreur non-Error — message par défaut', async () => {
    const { wrapper } = await mountView()
    const store = useAuthStore()
    vi.spyOn(store, 'requestPasswordReset').mockRejectedValue('boom')

    await wrapper.find('button.inline-link').trigger('click')
    await wrapper.find('input#forgot-email').setValue('a@b.c')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.find('.alert-error').text()).toMatch(/demande/i)
  })

  it('affiche le message info du store quand pas d erreur locale', async () => {
    const { wrapper } = await mountView()
    const store = useAuthStore()
    store.infoMessage = 'Vérifie ton email'
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.alert-info').text()).toContain('Vérifie ton email')
  })

  it('switchMode efface les messages localError + store', async () => {
    const { wrapper } = await mountView()
    const store = useAuthStore()
    vi.spyOn(store, 'login').mockRejectedValue(new Error('boom'))

    await wrapper.find('input#login-email').setValue('a@b.c')
    await wrapper.find('input#login-password').setValue('bad')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()
    expect(wrapper.find('.alert-error').exists()).toBe(true)

    await wrapper.findAll('.auth-tab')[1]!.trigger('click')
    expect(wrapper.find('.alert-error').exists()).toBe(false)
  })

  it('le bouton de soumission est désactivé quand le store loading=true', async () => {
    const { wrapper } = await mountView()
    const store = useAuthStore()
    store.loading = true
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.submit-button').attributes('disabled')).toBeDefined()
  })
})
