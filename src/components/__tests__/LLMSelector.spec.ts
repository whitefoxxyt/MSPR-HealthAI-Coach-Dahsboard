import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import LLMSelector from '../LLMSelector.vue'

function mountSelector() {
  return mount(LLMSelector, {
    global: { plugins: [createPinia()] },
  })
}

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
      user: { id: 'admin-1', username: 'admin', email: 'admin@healthai.test', role: 'admin' },
      tokens: {
        accessToken: 'jwt-test-token',
        refreshToken: 'refresh-token',
        expiresAt: '2099-01-01T00:00:00.000Z',
      },
    }),
  )
}

describe('LLMSelector', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    setActivePinia(createPinia())
    seedAuthSession()
    fetchSpy = vi.spyOn(globalThis, 'fetch')
  })

  afterEach(() => {
    fetchSpy.mockRestore()
    localStorage.removeItem(AUTH_STORAGE_KEY)
  })

  it('charge la preference au mount et marque le backend effectif comme selectionne', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({ preferred_llm: null, effective_llm: 'mistral' }))

    const wrapper = mountSelector()
    await flushPromises()

    const mistralRadio = wrapper.find('input[type="radio"][value="mistral"]')
    const ollamaRadio = wrapper.find('input[type="radio"][value="ollama"]')

    expect((mistralRadio.element as HTMLInputElement).checked).toBe(true)
    expect((ollamaRadio.element as HTMLInputElement).checked).toBe(false)
    expect(fetchSpy).toHaveBeenCalledWith(
      'http://localhost:8001/me/preferences',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({ Authorization: 'Bearer jwt-test-token' }),
      }),
    )
  })

  it('declenche PATCH /me/preferences sur selection d un backend (auto-save)', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({ preferred_llm: null, effective_llm: 'mistral' }))
    fetchSpy.mockResolvedValueOnce(
      jsonResponse({ preferred_llm: 'ollama', effective_llm: 'ollama' }),
    )

    const wrapper = mountSelector()
    await flushPromises()

    await wrapper.find('input[type="radio"][value="ollama"]').setValue(true)
    await flushPromises()

    expect(fetchSpy).toHaveBeenLastCalledWith(
      'http://localhost:8001/me/preferences',
      expect.objectContaining({
        method: 'PATCH',
        headers: expect.objectContaining({
          Authorization: 'Bearer jwt-test-token',
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ preferred_llm: 'ollama' }),
      }),
    )
  })

  it('affiche le nom du modele courant et synchronise avec la reponse PATCH', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({ preferred_llm: null, effective_llm: 'mistral' }))
    fetchSpy.mockResolvedValueOnce(
      jsonResponse({ preferred_llm: 'ollama', effective_llm: 'ollama' }),
    )

    const wrapper = mountSelector()
    await flushPromises()

    expect(wrapper.text()).toContain('mistral-small-latest')
    expect(wrapper.text()).not.toContain('gemma3:4b')

    await wrapper.find('input[type="radio"][value="ollama"]').setValue(true)
    await flushPromises()

    expect(wrapper.text()).toContain('gemma3:4b')
    expect(wrapper.text()).not.toContain('mistral-small-latest')
  })

  it('affiche un message d erreur si le GET initial echoue', async () => {
    fetchSpy.mockResolvedValueOnce(new Response('Internal Server Error', { status: 500 }))

    const wrapper = mountSelector()
    await flushPromises()

    const alert = wrapper.find('[role="alert"]')
    expect(alert.exists()).toBe(true)
    expect(alert.text()).toMatch(/erreur|impossible/i)
  })

  it('affiche un message d erreur si le PATCH echoue', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({ preferred_llm: null, effective_llm: 'mistral' }))
    fetchSpy.mockResolvedValueOnce(new Response('Bad Gateway', { status: 502 }))

    const wrapper = mountSelector()
    await flushPromises()

    await wrapper.find('input[type="radio"][value="ollama"]').setValue(true)
    await flushPromises()

    const alert = wrapper.find('[role="alert"]')
    expect(alert.exists()).toBe(true)
    expect(alert.text()).toMatch(/erreur|impossible/i)
  })
})
