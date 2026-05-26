import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BusinessKpisSection from '../BusinessKpisSection.vue'
import type { AnalyticsOverview } from '@/types'

function mkAnalytics(overrides: Partial<AnalyticsOverview['businessKpis']> = {}): AnalyticsOverview {
  return {
    ageDistribution: [],
    objectiveDistribution: [],
    progressionRateByPeriod: { '7d': 0, '30d': 0, '90d': 0 },
    userProgressionTrend: { '7d': [], '30d': [], '90d': [] },
    foodTrends: { '7d': [], '30d': [], '90d': [] },
    nutritionBalanceByProfile: [],
    topExercises: [],
    intensityLevels: [],
    businessKpis: {
      engagementRate: 76,
      premiumConversionRate: 12,
      satisfactionRate: 88,
      ...overrides,
    },
  }
}

describe('BusinessKpisSection', () => {
  it('rend les trois MetricsCards avec les bons titres', () => {
    const wrapper = mount(BusinessKpisSection, {
      props: { analytics: mkAnalytics() },
      global: { stubs: { FontAwesomeIcon: true } },
    })

    expect(wrapper.text()).toContain('Engagement')
    expect(wrapper.text()).toContain('Conversion premium')
    expect(wrapper.text()).toContain('Satisfaction')
  })

  it('passe les valeurs des KPIs au MetricsCard via les props (animées à l affichage)', () => {
    const wrapper = mount(BusinessKpisSection, {
      props: { analytics: mkAnalytics({ engagementRate: 99, premiumConversionRate: 5, satisfactionRate: 70 }) },
      global: { stubs: { FontAwesomeIcon: true, MetricsCard: true } },
    })

    const cards = wrapper.findAll('metrics-card-stub')
    expect(cards.length).toBe(3)
    expect(cards[0]!.attributes('value')).toBe('99')
    expect(cards[1]!.attributes('value')).toBe('5')
    expect(cards[2]!.attributes('value')).toBe('70')
  })
})
