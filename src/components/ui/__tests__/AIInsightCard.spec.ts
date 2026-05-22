import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AIInsightCard from '../AIInsightCard.vue'

describe('AIInsightCard', () => {
  it('renders the insight text passed as prop', () => {
    const wrapper = mount(AIInsightCard, {
      props: { text: 'Pense à ajouter des légumes verts.' },
    })

    expect(wrapper.text()).toContain('Pense à ajouter des légumes verts.')
  })

  it('shows the "Coach IA" badge', () => {
    const wrapper = mount(AIInsightCard, { props: { text: 'Hello' } })

    const badge = wrapper.find('[data-testid="ai-badge"]')
    expect(badge.exists()).toBe(true)
    expect(badge.text()).toMatch(/coach\s*ia/i)
  })

  it('marks the card with data-variant="acid" by default', () => {
    const wrapper = mount(AIInsightCard, { props: { text: 'hi' } })
    expect(wrapper.find('[data-testid="ai-card"]').attributes('data-variant')).toBe('acid')
  })

  it('renders the backend label when provided', () => {
    const wrapper = mount(AIInsightCard, {
      props: { text: 'Hi', backend: 'mistral' },
    })

    expect(wrapper.text().toLowerCase()).toContain('mistral')
  })

  it('omits the backend label when not provided', () => {
    const wrapper = mount(AIInsightCard, { props: { text: 'hi' } })
    expect(wrapper.find('[data-testid="ai-backend"]').exists()).toBe(false)
  })
})
