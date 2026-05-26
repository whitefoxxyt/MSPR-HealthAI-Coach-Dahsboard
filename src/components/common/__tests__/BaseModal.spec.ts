import { describe, it, expect, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseModal from '../BaseModal.vue'

afterEach(() => {
  document.body.innerHTML = ''
  document.body.style.overflow = ''
})

describe('BaseModal', () => {
  it('ne rend rien quand open=false', () => {
    mount(BaseModal, {
      props: { open: false, title: 'Titre' },
      attachTo: document.body,
      global: { stubs: { FontAwesomeIcon: true, teleport: true, Teleport: true } },
    })
    expect(document.querySelector('.modal-backdrop')).toBeNull()
  })

  it('rend le panel quand open=true avec rôle dialog et title', async () => {
    mount(BaseModal, {
      props: { open: true, title: 'Confirmation' },
      slots: { default: 'Contenu du body' },
      attachTo: document.body,
      global: { stubs: { FontAwesomeIcon: true } },
    })
    await new Promise((r) => setTimeout(r, 0))

    const panel = document.querySelector('.modal-panel')
    expect(panel).not.toBeNull()
    expect(panel!.getAttribute('role')).toBe('dialog')
    expect(panel!.getAttribute('aria-modal')).toBe('true')
    expect(document.querySelector('.modal-title')!.textContent).toBe('Confirmation')
    expect(document.querySelector('.modal-body')!.textContent).toContain('Contenu du body')
  })

  it('émet close au clic sur le bouton de fermeture', async () => {
    const wrapper = mount(BaseModal, {
      props: { open: true, title: 't' },
      attachTo: document.body,
      global: { stubs: { FontAwesomeIcon: true } },
    })

    const closeBtn = document.querySelector('.modal-close') as HTMLButtonElement
    closeBtn.click()
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('émet close au clic sur le backdrop quand closeOnBackdrop est true (défaut)', async () => {
    const wrapper = mount(BaseModal, {
      props: { open: true, title: 't' },
      attachTo: document.body,
      global: { stubs: { FontAwesomeIcon: true } },
    })

    const backdrop = document.querySelector('.modal-backdrop') as HTMLDivElement
    backdrop.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it("n'émet pas close au clic backdrop si closeOnBackdrop=false", async () => {
    const wrapper = mount(BaseModal, {
      props: { open: true, title: 't', closeOnBackdrop: false },
      attachTo: document.body,
      global: { stubs: { FontAwesomeIcon: true } },
    })

    const backdrop = document.querySelector('.modal-backdrop') as HTMLDivElement
    const evt = new MouseEvent('click', { bubbles: true })
    Object.defineProperty(evt, 'target', { value: backdrop })
    backdrop.dispatchEvent(evt)
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('close')).toBeFalsy()
  })

  it('applique la classe selon le variant', async () => {
    mount(BaseModal, {
      props: { open: true, title: 't', variant: 'danger' },
      attachTo: document.body,
      global: { stubs: { FontAwesomeIcon: true } },
    })
    await new Promise((r) => setTimeout(r, 0))
    expect(document.querySelector('.modal-panel--danger')).not.toBeNull()
  })

  it('rend le footer quand le slot footer est fourni', async () => {
    mount(BaseModal, {
      props: { open: true, title: 't' },
      slots: { footer: '<button>OK</button>' },
      attachTo: document.body,
      global: { stubs: { FontAwesomeIcon: true } },
    })
    await new Promise((r) => setTimeout(r, 0))
    expect(document.querySelector('.modal-footer')).not.toBeNull()
  })

  it('met body.style.overflow à hidden quand on l ouvre, vide quand on ferme', async () => {
    const wrapper = mount(BaseModal, {
      props: { open: false, title: 't' },
      attachTo: document.body,
      global: { stubs: { FontAwesomeIcon: true } },
    })

    await wrapper.setProps({ open: true })
    await new Promise((r) => setTimeout(r, 0))
    expect(document.body.style.overflow).toBe('hidden')

    await wrapper.setProps({ open: false })
    await new Promise((r) => setTimeout(r, 0))
    expect(document.body.style.overflow).toBe('')
  })

  it('émet close au keydown.esc', async () => {
    const wrapper = mount(BaseModal, {
      props: { open: true, title: 't' },
      attachTo: document.body,
      global: { stubs: { FontAwesomeIcon: true } },
    })

    const panel = document.querySelector('.modal-panel') as HTMLElement
    panel.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('close')).toBeTruthy()
  })
})
