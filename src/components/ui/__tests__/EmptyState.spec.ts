import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EmptyState from '../EmptyState.vue'

describe('EmptyState', () => {
  it('renders the title prop as a heading', () => {
    const wrapper = mount(EmptyState, { props: { title: 'Aucune analyse pour le moment' } })
    expect(wrapper.find('h2, h3, h4').text()).toBe('Aucune analyse pour le moment')
  })

  it('renders the optional message prop', () => {
    const wrapper = mount(EmptyState, {
      props: { title: 'Rien ici', message: 'Lance ta première analyse depuis la photo de ton repas.' },
    })
    expect(wrapper.text()).toContain('Lance ta première analyse')
  })

  it('renders an action slot when provided', () => {
    const wrapper = mount(EmptyState, {
      props: { title: 'Rien' },
      slots: { action: '<button>Analyser</button>' },
    })
    expect(wrapper.find('button').text()).toBe('Analyser')
  })

  it('exposes role="status" for screen readers', () => {
    const wrapper = mount(EmptyState, { props: { title: 'Rien' } })
    expect(wrapper.attributes('role')).toBe('status')
  })
})
