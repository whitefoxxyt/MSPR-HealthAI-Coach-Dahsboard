import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DataQualitySection from '../DataQualitySection.vue'
import type { DataQualityMetrics, EtlReport, DataFlowStats } from '@/types'

function mkMetrics(overrides: Partial<DataQualityMetrics> = {}): DataQualityMetrics {
  return {
    totalRecords: 1000,
    missingValues: 100,
    duplicates: 50,
    anomalies: 25,
    completenessRate: 96,
    dataFlowStatus: 'active',
    lastUpdate: '2026-05-26T00:00:00Z',
    ...overrides,
  }
}

function mkEtl(overrides: Partial<EtlReport> = {}): EtlReport {
  return {
    generatedAt: '2026-05-26T10:00:00Z',
    pipelines: [
      {
        name: 'exercisedb',
        status: 'OK',
        rowsRead: 500, rowsInserted: 490, rowsRejected: 10, rejectionRate: 0.02,
        durationS: 0.4, tables: {}, topRejectionReasons: { dup: 6, miss: 4 },
      },
      {
        name: 'nutrition',
        status: 'OK',
        rowsRead: 300, rowsInserted: 300, rowsRejected: 0, rejectionRate: 0,
        durationS: 0.2, tables: {}, topRejectionReasons: {},
      },
    ],
    totals: { rowsRead: 800, rowsInserted: 790, rowsRejected: 10, rejectionRate: 0.012 },
    ...overrides,
  }
}

function mkFlows(): DataFlowStats[] {
  return [
    { name: 'Nutrition', type: 'nutrition', status: 'active', recordsToday: 100, lastSync: new Date().toISOString(), errorRate: 0.5 },
    { name: 'Exercice', type: 'exercise', status: 'inactive', recordsToday: 0, lastSync: new Date().toISOString(), errorRate: 2 },
    { name: 'Biométrie', type: 'biometric', status: 'error', recordsToday: 10, lastSync: new Date().toISOString(), errorRate: 8 },
  ]
}

function mountSection(overrides: {
  metrics?: DataQualityMetrics | null
  healthScore?: number
  etlReport?: EtlReport | null
  flows?: DataFlowStats[]
} = {}) {
  return mount(DataQualitySection, {
    props: {
      metrics: overrides.metrics === undefined ? mkMetrics() : overrides.metrics,
      healthScore: overrides.healthScore ?? 96,
      criticalAnomaliesCount: 3,
      pendingAnomaliesCount: 7,
      pendingRecordsCount: 5,
      etlReport: overrides.etlReport === undefined ? mkEtl() : overrides.etlReport,
      flows: overrides.flows ?? mkFlows(),
    },
    global: { stubs: { FontAwesomeIcon: true, MetricsCard: true } },
  })
}

describe('DataQualitySection', () => {
  it('rend les 8 MetricsCards (stubés)', () => {
    const wrapper = mountSection()
    expect(wrapper.findAll('metrics-card-stub').length).toBe(8)
  })

  it('rend une flow-row par flux', () => {
    const wrapper = mountSection()
    expect(wrapper.findAll('.flow-row')).toHaveLength(3)
  })

  it('applique flow-row--active / inactive / error', () => {
    const wrapper = mountSection()
    expect(wrapper.find('.flow-row--active').exists()).toBe(true)
    expect(wrapper.find('.flow-row--inactive').exists()).toBe(true)
    expect(wrapper.find('.flow-row--error').exists()).toBe(true)
  })

  it('classes d erreur err-low / err-med / err-high selon le taux', () => {
    const wrapper = mountSection()
    expect(wrapper.find('.err-low').exists()).toBe(true)
    expect(wrapper.find('.err-med').exists()).toBe(true)
    expect(wrapper.find('.err-high').exists()).toBe(true)
  })

  it('affiche la table des rejets ETL quand il y a des rejets', () => {
    const wrapper = mountSection()
    expect(wrapper.find('.reject-table').exists()).toBe(true)
    expect(wrapper.text()).toContain('exercisedb')
    expect(wrapper.text()).toContain('dup')
  })

  it('n affiche pas la table si aucun pipeline en rejet', () => {
    const wrapper = mountSection({
      etlReport: mkEtl({
        pipelines: [{
          name: 'a', status: 'OK', rowsRead: 100, rowsInserted: 100, rowsRejected: 0,
          rejectionRate: 0, durationS: 0.1, tables: {}, topRejectionReasons: {},
        }],
        totals: { rowsRead: 100, rowsInserted: 100, rowsRejected: 0, rejectionRate: 0 },
      }),
    })
    expect(wrapper.find('.reject-table').exists()).toBe(false)
  })

  it('affiche "—" pour les pipelines sans raison de rejet', () => {
    const wrapper = mountSection({
      etlReport: mkEtl({
        pipelines: [{
          name: 'p', status: 'OK', rowsRead: 100, rowsInserted: 80, rowsRejected: 20,
          rejectionRate: 0.2, durationS: 0.1, tables: {}, topRejectionReasons: {},
        }],
        totals: { rowsRead: 100, rowsInserted: 80, rowsRejected: 20, rejectionRate: 0.2 },
      }),
    })
    expect(wrapper.text()).toContain('—')
  })

  it('gère gracieusement metrics=null et etlReport=null', () => {
    const wrapper = mountSection({ metrics: null, etlReport: null })
    expect(wrapper.find('.reject-table').exists()).toBe(false)
  })
})
