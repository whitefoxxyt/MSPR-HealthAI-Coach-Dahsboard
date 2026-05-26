import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import FileDropzone from '../FileDropzone.vue'

describe('FileDropzone — extras', () => {
  it('Enter sur le trigger déclenche un click sur l input', async () => {
    const wrapper = mount(FileDropzone, { attachTo: document.body })
    const input = wrapper.find('input[type="file"]').element as HTMLInputElement
    const clickSpy = vi.spyOn(input, 'click').mockImplementation(() => {})
    await wrapper.find('[data-testid="dropzone-trigger"]').trigger('keydown', { key: 'Enter' })
    expect(clickSpy).toHaveBeenCalled()
    wrapper.unmount()
  })

  it('Espace sur le trigger déclenche un click sur l input', async () => {
    const wrapper = mount(FileDropzone, { attachTo: document.body })
    const input = wrapper.find('input[type="file"]').element as HTMLInputElement
    const clickSpy = vi.spyOn(input, 'click').mockImplementation(() => {})
    await wrapper.find('[data-testid="dropzone-trigger"]').trigger('keydown', { key: ' ' })
    expect(clickSpy).toHaveBeenCalled()
    wrapper.unmount()
  })

  it('Autre touche: pas de click', async () => {
    const wrapper = mount(FileDropzone, { attachTo: document.body })
    const input = wrapper.find('input[type="file"]').element as HTMLInputElement
    const clickSpy = vi.spyOn(input, 'click').mockImplementation(() => {})
    await wrapper.find('[data-testid="dropzone-trigger"]').trigger('keydown', { key: 'a' })
    expect(clickSpy).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('disabled + Enter: pas de click', async () => {
    const wrapper = mount(FileDropzone, { props: { disabled: true }, attachTo: document.body })
    const input = wrapper.find('input[type="file"]').element as HTMLInputElement
    const clickSpy = vi.spyOn(input, 'click').mockImplementation(() => {})
    await wrapper.find('[data-testid="dropzone-trigger"]').trigger('keydown', { key: 'Enter' })
    expect(clickSpy).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('dragover ajoute data-dragging=true puis dragleave repasse à false', async () => {
    const wrapper = mount(FileDropzone, { attachTo: document.body })

    await wrapper.find('[data-testid="dropzone"]').trigger('dragover')
    expect(wrapper.find('[data-testid="dropzone"]').attributes('data-dragging')).toBe('true')

    await wrapper.find('[data-testid="dropzone"]').trigger('dragleave')
    expect(wrapper.find('[data-testid="dropzone"]').attributes('data-dragging')).toBe('false')
    wrapper.unmount()
  })

  it('dragover quand disabled: ne change pas data-dragging', async () => {
    const wrapper = mount(FileDropzone, { props: { disabled: true }, attachTo: document.body })
    await wrapper.find('[data-testid="dropzone"]').trigger('dragover')
    expect(wrapper.find('[data-testid="dropzone"]').attributes('data-dragging')).toBe('false')
    wrapper.unmount()
  })

  it('input change quand disabled: ne fait rien', async () => {
    const wrapper = mount(FileDropzone, { props: { disabled: true }, attachTo: document.body })
    const input = wrapper.find('input[type="file"]').element as HTMLInputElement
    const file = new File([new Uint8Array(100)], 'a.png', { type: 'image/png' })
    Object.defineProperty(input, 'files', { value: [file], configurable: true })
    await wrapper.find('input[type="file"]').trigger('change')
    expect(wrapper.emitted('file')).toBeFalsy()
    wrapper.unmount()
  })

  it('attribut data-disabled reflète la prop', () => {
    const wrapper = mount(FileDropzone, { props: { disabled: true } })
    expect(wrapper.find('[data-testid="dropzone"]').attributes('data-disabled')).toBe('true')
  })
})
