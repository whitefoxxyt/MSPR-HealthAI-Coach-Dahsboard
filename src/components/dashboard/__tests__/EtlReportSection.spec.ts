import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EtlReportSection from '../EtlReportSection.vue'
import type { EtlReport } from '@/types'

function mkReport(overrides: Partial<EtlReport> = {}): EtlReport {
  return {
    generatedAt: '2026-05-26T10:00:00Z',
    pipelines: [
      {
        name: 'exercisedb',
        status: 'OK',
        rowsRead: 1000,
        rowsInserted: 950,
        rowsRejected: 50,
        rejectionRate: 0.05,
        durationS: 1.23,
        tables: { exercises: 950 },
        topRejectionReasons: { duplicate: 30, missing_field: 20 },
      },
      {
        name: 'failing-pipeline',
        status: 'FAILED',
        rowsRead: 500,
        rowsInserted: 0,
        rowsRejected: 500,
        rejectionRate: 1.0,
        durationS: 0.5,
        tables: {},
        topRejectionReasons: {},
      },
    ],
    totals: { rowsRead: 1500, rowsInserted: 950, rowsRejected: 550, rejectionRate: 0.37 },
    ...overrides,
  }
}

describe('EtlReportSection', () => {
  it('rend le header avec generatedAt et les totaux', () => {
    const wrapper = mount(EtlReportSection, { props: { report: mkReport() } })

    expect(wrapper.text()).toContain('2026-05-26')
    expect(wrapper.text()).toMatch(/1[\s ]?500/)
    expect(wrapper.text()).toMatch(/950/)
    expect(wrapper.text()).toMatch(/550/)
    expect(wrapper.text()).toContain('37.0%')
  })

  it('rend une pipeline-card par pipeline', () => {
    const wrapper = mount(EtlReportSection, { props: { report: mkReport() } })
    expect(wrapper.findAll('.pipeline-card')).toHaveLength(2)
  })

  it('applique pipeline-card--ok pour le status OK et --error sinon', () => {
    const wrapper = mount(EtlReportSection, { props: { report: mkReport() } })
    expect(wrapper.find('.pipeline-card--ok').exists()).toBe(true)
    expect(wrapper.find('.pipeline-card--error').exists()).toBe(true)
  })

  it('rend les rejection reasons quand présentes', () => {
    const wrapper = mount(EtlReportSection, { props: { report: mkReport() } })
    expect(wrapper.text()).toContain('duplicate')
    expect(wrapper.text()).toContain('missing_field')
  })

  it('n affiche pas le bloc reasons si vide', () => {
    const wrapper = mount(EtlReportSection, { props: { report: mkReport() } })
    const cards = wrapper.findAll('.pipeline-card')
    expect(cards[1]!.find('.rejection-reasons').exists()).toBe(false)
  })

  it('applique etl-total--warn quand rejectionRate > 5%', () => {
    const wrapper = mount(EtlReportSection, { props: { report: mkReport() } })
    expect(wrapper.find('.etl-total--warn').exists()).toBe(true)
  })

  it('applique etl-total--ok quand rejectionRate <= 5%', () => {
    const report = mkReport({ totals: { rowsRead: 1000, rowsInserted: 990, rowsRejected: 10, rejectionRate: 0.01 } })
    const wrapper = mount(EtlReportSection, { props: { report } })
    expect(wrapper.findAll('.etl-total--ok').length).toBeGreaterThanOrEqual(2)
  })

  it('applique text-warn dans les pipelines à fort rejet', () => {
    const wrapper = mount(EtlReportSection, { props: { report: mkReport() } })
    expect(wrapper.find('.text-warn').exists()).toBe(true)
  })
})
