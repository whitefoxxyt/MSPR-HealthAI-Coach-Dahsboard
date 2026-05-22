import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppChip from '../AppChip.vue'

describe('AppChip', () => {
  it('renders its default slot as the label', () => {
    const wrapper = mount(AppChip, { slots: { default: 'Vegan' } })
    expect(wrapper.text()).toContain('Vegan')
  })

  it('reflects the selected prop as data-selected', () => {
    expect(mount(AppChip, { slots: { default: 'x' } }).attributes('data-selected')).toBeUndefined()
    expect(
      mount(AppChip, { props: { selected: true }, slots: { default: 'x' } }).attributes('data-selected'),
    ).toBe('true')
  })

  it('emits toggle when activated', async () => {
    const wrapper = mount(AppChip, { slots: { default: 'x' } })
    await wrapper.trigger('click')
    expect(wrapper.emitted('toggle')).toHaveLength(1)
  })

  it('shows a remove button when removable and emits remove on click', async () => {
    const wrapper = mount(AppChip, {
      props: { removable: true },
      slots: { default: 'Tag' },
    })
    const removeBtn = wrapper.find('[data-remove]')
    expect(removeBtn.exists()).toBe(true)
    await removeBtn.trigger('click')
    expect(wrapper.emitted('remove')).toHaveLength(1)
    // Removing should not also trigger a toggle
    expect(wrapper.emitted('toggle')).toBeUndefined()
  })
})
