import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppBadge from '../AppBadge.vue'

describe('AppBadge', () => {
  it('renders its default slot as the label', () => {
    const wrapper = mount(AppBadge, { slots: { default: 'Beta' } })
    expect(wrapper.text()).toBe('Beta')
  })

  it('defaults variant to neutral and exposes data-variant', () => {
    const wrapper = mount(AppBadge, { slots: { default: '.' } })
    expect(wrapper.attributes('data-variant')).toBe('neutral')
  })

  it('honours the variant prop (acid, coral, sky, mint)', () => {
    for (const variant of ['acid', 'coral', 'sky', 'mint'] as const) {
      expect(
        mount(AppBadge, { props: { variant }, slots: { default: '.' } }).attributes('data-variant'),
      ).toBe(variant)
    }
  })

  it('defaults size to md and honours sm', () => {
    expect(mount(AppBadge, { slots: { default: '.' } }).attributes('data-size')).toBe('md')
    expect(
      mount(AppBadge, { props: { size: 'sm' }, slots: { default: '.' } }).attributes('data-size'),
    ).toBe('sm')
  })
})
