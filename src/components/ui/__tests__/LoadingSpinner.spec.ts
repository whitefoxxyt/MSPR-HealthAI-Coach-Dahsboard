import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import LoadingSpinner from '../LoadingSpinner.vue'

describe('LoadingSpinner', () => {
  it('exposes role="status" with an accessible label', () => {
    const wrapper = mount(LoadingSpinner)
    expect(wrapper.attributes('role')).toBe('status')
    expect(wrapper.attributes('aria-label')).toBe('Chargement en cours')
  })

  it('lets you override the label', () => {
    const wrapper = mount(LoadingSpinner, { props: { label: 'Analyse en cours...' } })
    expect(wrapper.attributes('aria-label')).toBe('Analyse en cours...')
  })

  it('defaults size to md and honours sm/lg', () => {
    expect(mount(LoadingSpinner).attributes('data-size')).toBe('md')
    expect(mount(LoadingSpinner, { props: { size: 'sm' } }).attributes('data-size')).toBe('sm')
    expect(mount(LoadingSpinner, { props: { size: 'lg' } }).attributes('data-size')).toBe('lg')
  })
})
