import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ExportActions from '../ExportActions.vue'

describe('ExportActions', () => {
  it('rend deux boutons PDF et JSON', () => {
    const wrapper = mount(ExportActions)
    expect(wrapper.find('[data-testid="export-pdf-button"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="export-json-button"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Exporter PDF')
    expect(wrapper.text()).toContain('Exporter JSON')
  })

  it('émet export-pdf au clic sur le bouton PDF', async () => {
    const wrapper = mount(ExportActions)
    await wrapper.find('[data-testid="export-pdf-button"]').trigger('click')
    expect(wrapper.emitted('export-pdf')).toHaveLength(1)
  })

  it('émet export-json au clic sur le bouton JSON', async () => {
    const wrapper = mount(ExportActions)
    await wrapper.find('[data-testid="export-json-button"]').trigger('click')
    expect(wrapper.emitted('export-json')).toHaveLength(1)
  })

  it('utilise un ariaLabel par défaut', () => {
    const wrapper = mount(ExportActions)
    expect(wrapper.attributes('aria-label')).toBe('Exporter')
  })

  it('honore un ariaLabel personnalisé', () => {
    const wrapper = mount(ExportActions, { props: { ariaLabel: 'Exports custom' } })
    expect(wrapper.attributes('aria-label')).toBe('Exports custom')
  })
})
