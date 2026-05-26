import { describe, it, expect, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ConfirmDialog from '../ConfirmDialog.vue'

afterEach(() => {
  document.body.innerHTML = ''
  document.body.style.overflow = ''
})

describe('ConfirmDialog', () => {
  it('rend le titre, le message et les boutons par défaut', async () => {
    mount(ConfirmDialog, {
      props: { open: true, title: 'Confirmer ?', message: 'Es-tu sûr ?' },
      attachTo: document.body,
      global: { stubs: { FontAwesomeIcon: true } },
    })
    await new Promise((r) => setTimeout(r, 0))

    expect(document.querySelector('.modal-title')!.textContent).toBe('Confirmer ?')
    expect(document.body.textContent).toContain('Es-tu sûr ?')
    expect(document.body.textContent).toContain('Confirmer')
    expect(document.body.textContent).toContain('Annuler')
  })

  it('honore confirmLabel et cancelLabel', async () => {
    mount(ConfirmDialog, {
      props: {
        open: true,
        title: 't',
        message: 'm',
        confirmLabel: 'Supprimer',
        cancelLabel: 'Non merci',
      },
      attachTo: document.body,
      global: { stubs: { FontAwesomeIcon: true } },
    })
    await new Promise((r) => setTimeout(r, 0))

    expect(document.body.textContent).toContain('Supprimer')
    expect(document.body.textContent).toContain('Non merci')
  })

  it('émet confirm quand on clique sur le bouton de confirmation', async () => {
    const wrapper = mount(ConfirmDialog, {
      props: { open: true, title: 't', message: 'm' },
      attachTo: document.body,
      global: { stubs: { FontAwesomeIcon: true } },
    })
    await new Promise((r) => setTimeout(r, 0))

    const buttons = Array.from(document.querySelectorAll('.modal-footer button')) as HTMLButtonElement[]
    const confirmBtn = buttons.find((b) => b.textContent?.includes('Confirmer'))!
    confirmBtn.click()
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('confirm')).toBeTruthy()
  })

  it('émet cancel quand on clique sur le bouton d annulation', async () => {
    const wrapper = mount(ConfirmDialog, {
      props: { open: true, title: 't', message: 'm' },
      attachTo: document.body,
      global: { stubs: { FontAwesomeIcon: true } },
    })
    await new Promise((r) => setTimeout(r, 0))

    const buttons = Array.from(document.querySelectorAll('.modal-footer button')) as HTMLButtonElement[]
    const cancelBtn = buttons.find((b) => b.textContent?.includes('Annuler'))!
    cancelBtn.click()
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('cancel')).toBeTruthy()
  })

  it('applique la classe danger sur le bouton de confirmation pour variant=danger', async () => {
    mount(ConfirmDialog, {
      props: { open: true, title: 't', message: 'm', variant: 'danger' },
      attachTo: document.body,
      global: { stubs: { FontAwesomeIcon: true } },
    })
    await new Promise((r) => setTimeout(r, 0))

    expect(document.querySelector('.btn-danger')).not.toBeNull()
  })

  it('applique la classe success sur le bouton de confirmation pour variant=success', async () => {
    mount(ConfirmDialog, {
      props: { open: true, title: 't', message: 'm', variant: 'success' },
      attachTo: document.body,
      global: { stubs: { FontAwesomeIcon: true } },
    })
    await new Promise((r) => setTimeout(r, 0))

    expect(document.querySelector('.btn-success')).not.toBeNull()
  })

  it('désactive les boutons et affiche "Traitement…" quand loading=true', async () => {
    mount(ConfirmDialog, {
      props: { open: true, title: 't', message: 'm', loading: true },
      attachTo: document.body,
      global: { stubs: { FontAwesomeIcon: true } },
    })
    await new Promise((r) => setTimeout(r, 0))

    const buttons = Array.from(document.querySelectorAll('.modal-footer button')) as HTMLButtonElement[]
    expect(buttons.every((b) => b.disabled)).toBe(true)
    expect(document.body.textContent).toContain('Traitement')
  })
})
