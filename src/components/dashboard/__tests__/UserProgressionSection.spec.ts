import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import type { AnalyticsOverview } from '@/types'

const destroyMock = vi.fn()
vi.mock('chart.js/auto', () => {
  const Chart = vi.fn(function (this: object) {
    Object.assign(this, { destroy: destroyMock })
  })
  return { default: Chart }
})

import Chart from 'chart.js/auto'
const ChartMock = Chart as unknown as ReturnType<typeof vi.fn>

import UserProgressionSection from '../UserProgressionSection.vue'

function mkAnalytics(): AnalyticsOverview {
  return {
    ageDistribution: [
      { label: '18-24', value: 30 },
      { label: '25-34', value: 50 },
    ],
    objectiveDistribution: [
      { label: 'Muscle', value: 40 },
      { label: 'Perte', value: 35 },
    ],
    progressionRateByPeriod: { '7d': 12, '30d': 25, '90d': 40 },
    userProgressionTrend: {
      '7d': [{ label: 'L', value: 10 }],
      '30d': [{ label: 'S1', value: 15 }],
      '90d': [{ label: 'M1', value: 25 }],
    },
    foodTrends: { '7d': [], '30d': [], '90d': [] },
    nutritionBalanceByProfile: [],
    topExercises: [],
    intensityLevels: [],
    businessKpis: { engagementRate: 0, premiumConversionRate: 0, satisfactionRate: 0 },
  }
}

describe('UserProgressionSection', () => {
  beforeEach(() => {
    ChartMock.mockClear()
    destroyMock.mockClear()
  })

  it('rend les 3 figures', () => {
    const wrapper = mount(UserProgressionSection, {
      props: { analytics: mkAnalytics(), period: '30d' },
      attachTo: document.body,
    })
    expect(wrapper.findAll('figure.chart-card')).toHaveLength(3)
    wrapper.unmount()
  })

  it('rend les labels du period (30j)', () => {
    const wrapper = mount(UserProgressionSection, {
      props: { analytics: mkAnalytics(), period: '30d' },
      attachTo: document.body,
    })
    expect(wrapper.text()).toContain('30 derniers jours')
    wrapper.unmount()
  })

  it('rend les labels du period (7j)', () => {
    const wrapper = mount(UserProgressionSection, {
      props: { analytics: mkAnalytics(), period: '7d' },
      attachTo: document.body,
    })
    expect(wrapper.text()).toContain('7 derniers jours')
    wrapper.unmount()
  })

  it('rend les labels du period (90j)', () => {
    const wrapper = mount(UserProgressionSection, {
      props: { analytics: mkAnalytics(), period: '90d' },
      attachTo: document.body,
    })
    expect(wrapper.text()).toContain('90 derniers jours')
    wrapper.unmount()
  })

  it('affiche le taux de progression formaté du period', () => {
    const wrapper = mount(UserProgressionSection, {
      props: { analytics: mkAnalytics(), period: '30d' },
      attachTo: document.body,
    })
    expect(wrapper.find('.big-rate').text()).toMatch(/25/)
    wrapper.unmount()
  })

  it('régénère 3 charts quand les analytics changent', async () => {
    const wrapper = mount(UserProgressionSection, {
      props: { analytics: mkAnalytics(), period: '30d' },
      attachTo: document.body,
    })
    ChartMock.mockClear()
    await wrapper.setProps({ analytics: mkAnalytics() })
    await wrapper.vm.$nextTick()
    expect(ChartMock).toHaveBeenCalledTimes(3)
    wrapper.unmount()
  })

  it('régénère le trend chart quand le period change', async () => {
    const wrapper = mount(UserProgressionSection, {
      props: { analytics: mkAnalytics(), period: '30d' },
      attachTo: document.body,
    })
    ChartMock.mockClear()
    await wrapper.setProps({ period: '7d' })
    await wrapper.vm.$nextTick()
    expect(ChartMock).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })

  it('démontage sans crash', () => {
    const wrapper = mount(UserProgressionSection, {
      props: { analytics: mkAnalytics(), period: '30d' },
      attachTo: document.body,
    })
    expect(() => wrapper.unmount()).not.toThrow()
  })
})
