import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppCard from '../AppCard.vue'

describe('AppCard', () => {
  it('renders its default slot', () => {
    const wrapper = mount(AppCard, { slots: { default: 'Contenu' } })
    expect(wrapper.text()).toContain('Contenu')
  })

  it('renders an optional title prop as the heading', () => {
    const wrapper = mount(AppCard, {
      props: { title: 'Mes analyses' },
      slots: { default: '...' },
    })
    expect(wrapper.find('h3').text()).toBe('Mes analyses')
  })

  it('renders an optional eyebrow prop above the title', () => {
    const wrapper = mount(AppCard, {
      props: { eyebrow: 'Nutrition', title: 'Plan repas' },
      slots: { default: '...' },
    })
    expect(wrapper.find('[data-eyebrow]').text()).toBe('Nutrition')
  })

  it('omits the header when no title and no eyebrow are provided', () => {
    const wrapper = mount(AppCard, { slots: { default: 'Plain' } })
    expect(wrapper.find('[data-card-header]').exists()).toBe(false)
  })

  it('defaults variant to default and exposes data-variant', () => {
    const wrapper = mount(AppCard, { slots: { default: '.' } })
    expect(wrapper.attributes('data-variant')).toBe('default')
  })

  it('honours the variant prop (elevated, outline, acid)', () => {
    expect(
      mount(AppCard, { props: { variant: 'elevated' }, slots: { default: '.' } }).attributes('data-variant'),
    ).toBe('elevated')
    expect(
      mount(AppCard, { props: { variant: 'outline' }, slots: { default: '.' } }).attributes('data-variant'),
    ).toBe('outline')
    expect(
      mount(AppCard, { props: { variant: 'acid' }, slots: { default: '.' } }).attributes('data-variant'),
    ).toBe('acid')
  })
})
