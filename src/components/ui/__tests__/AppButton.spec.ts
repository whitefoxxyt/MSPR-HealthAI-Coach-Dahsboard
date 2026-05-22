import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppButton from '../AppButton.vue'

describe('AppButton', () => {
  it('renders its default slot as the label', () => {
    const wrapper = mount(AppButton, { slots: { default: 'Analyser' } })
    expect(wrapper.text()).toBe('Analyser')
  })

  it('defaults variant to primary, exposed as data-variant', () => {
    const wrapper = mount(AppButton, { slots: { default: 'Go' } })
    expect(wrapper.attributes('data-variant')).toBe('primary')
  })

  it('honours the variant prop (acid, outline, ghost)', () => {
    expect(
      mount(AppButton, { props: { variant: 'acid' }, slots: { default: 'Go' } }).attributes('data-variant'),
    ).toBe('acid')
    expect(
      mount(AppButton, { props: { variant: 'outline' }, slots: { default: 'Go' } }).attributes('data-variant'),
    ).toBe('outline')
    expect(
      mount(AppButton, { props: { variant: 'ghost' }, slots: { default: 'Go' } }).attributes('data-variant'),
    ).toBe('ghost')
  })

  it('defaults size to md and honours sm/lg', () => {
    expect(mount(AppButton, { slots: { default: 'Go' } }).attributes('data-size')).toBe('md')
    expect(
      mount(AppButton, { props: { size: 'sm' }, slots: { default: 'Go' } }).attributes('data-size'),
    ).toBe('sm')
    expect(
      mount(AppButton, { props: { size: 'lg' }, slots: { default: 'Go' } }).attributes('data-size'),
    ).toBe('lg')
  })

  it('emits click when user activates the button', async () => {
    const wrapper = mount(AppButton, { slots: { default: 'Go' } })
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('does not emit click when disabled', async () => {
    const wrapper = mount(AppButton, {
      props: { disabled: true },
      slots: { default: 'Go' },
    })
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
  })

  it('marks the button busy and disabled when loading', () => {
    const wrapper = mount(AppButton, {
      props: { loading: true },
      slots: { default: 'Go' },
    })
    expect(wrapper.attributes('aria-busy')).toBe('true')
    expect(wrapper.attributes('disabled')).toBeDefined()
  })

  it('forwards type="submit" when explicitly set', () => {
    const wrapper = mount(AppButton, {
      props: { type: 'submit' },
      slots: { default: 'Go' },
    })
    expect(wrapper.attributes('type')).toBe('submit')
  })
})
