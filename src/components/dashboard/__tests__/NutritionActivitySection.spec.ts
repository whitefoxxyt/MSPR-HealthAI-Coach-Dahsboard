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

import NutritionActivitySection from '../NutritionActivitySection.vue'

function mkAnalytics(): AnalyticsOverview {
  return {
    ageDistribution: [],
    objectiveDistribution: [],
    progressionRateByPeriod: { '7d': 0, '30d': 0, '90d': 0 },
    userProgressionTrend: { '7d': [], '30d': [], '90d': [] },
    foodTrends: { '7d': [], '30d': [], '90d': [] },
    nutritionBalanceByProfile: [
      { profile: 'sportif', deficit: 10, excess: 5 },
      { profile: 'sedentaire', deficit: 2, excess: 12 },
    ],
    topExercises: [
      { label: 'Squat', value: 50 },
      { label: 'Bench', value: 30 },
    ],
    intensityLevels: [
      { label: 'Faible', value: 20 },
      { label: 'Modéré', value: 50 },
      { label: 'Élevé', value: 30 },
    ],
    businessKpis: { engagementRate: 0, premiumConversionRate: 0, satisfactionRate: 0 },
  }
}

describe('NutritionActivitySection', () => {
  beforeEach(() => {
    ChartMock.mockClear()
    destroyMock.mockClear()
  })

  it('rend les 3 figures avec leurs titres', () => {
    const wrapper = mount(NutritionActivitySection, {
      props: { analytics: mkAnalytics() },
      attachTo: document.body,
    })
    expect(wrapper.findAll('figure.chart-card')).toHaveLength(3)
    expect(wrapper.text()).toContain('Déficits / Excès par profil')
    expect(wrapper.text()).toContain('Exercices les plus pratiqués')
    expect(wrapper.text()).toMatch(/Niveaux d.intensité|Niveaux d intensité/)
    wrapper.unmount()
  })

  it('régénère 3 charts quand les analytics changent', async () => {
    const wrapper = mount(NutritionActivitySection, {
      props: { analytics: mkAnalytics() },
      attachTo: document.body,
    })
    ChartMock.mockClear()

    const next = mkAnalytics()
    next.topExercises = [{ label: 'New', value: 1 }]
    await wrapper.setProps({ analytics: next })
    await wrapper.vm.$nextTick()
    expect(ChartMock).toHaveBeenCalledTimes(3)
    wrapper.unmount()
  })

  it('passe les bons labels au chart de nutrition lors du re-render', async () => {
    const wrapper = mount(NutritionActivitySection, {
      props: { analytics: mkAnalytics() },
      attachTo: document.body,
    })
    ChartMock.mockClear()

    const next = mkAnalytics()
    await wrapper.setProps({ analytics: next })
    await wrapper.vm.$nextTick()

    const firstCall = ChartMock.mock.calls[0]!
    const config = firstCall[1] as { type: string; data: { labels: string[] } }
    expect(config.type).toBe('bar')
    expect(config.data.labels).toEqual(['sportif', 'sedentaire'])
    wrapper.unmount()
  })

  it('utilise un doughnut pour intensité', async () => {
    const wrapper = mount(NutritionActivitySection, {
      props: { analytics: mkAnalytics() },
      attachTo: document.body,
    })
    ChartMock.mockClear()
    await wrapper.setProps({ analytics: mkAnalytics() })
    await wrapper.vm.$nextTick()
    const intensityCall = ChartMock.mock.calls[2]!
    const config = intensityCall[1] as { type: string }
    expect(config.type).toBe('doughnut')
    wrapper.unmount()
  })

  it('démontage sans crash', () => {
    const wrapper = mount(NutritionActivitySection, {
      props: { analytics: mkAnalytics() },
      attachTo: document.body,
    })
    expect(() => wrapper.unmount()).not.toThrow()
  })
})
