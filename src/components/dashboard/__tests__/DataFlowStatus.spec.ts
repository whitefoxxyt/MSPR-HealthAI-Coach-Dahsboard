import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DataFlowStatus from '../DataFlowStatus.vue'
import type { DataFlowStats } from '@/types'

function mkFlow(overrides: Partial<DataFlowStats> = {}): DataFlowStats {
  return {
    name: 'Nutrition',
    type: 'nutrition',
    status: 'active',
    recordsToday: 1234,
    lastSync: new Date(Date.now() - 60_000).toISOString(),
    errorRate: 0.5,
    ...overrides,
  }
}

describe('DataFlowStatus', () => {
  it('rend une carte par flux et son nom', () => {
    const wrapper = mount(DataFlowStatus, {
      props: {
        flows: [
          mkFlow({ name: 'A' }),
          mkFlow({ name: 'B', status: 'inactive' }),
          mkFlow({ name: 'C', status: 'error' }),
        ],
      },
    })
    expect(wrapper.findAll('.flow-card')).toHaveLength(3)
    expect(wrapper.text()).toContain('A')
    expect(wrapper.text()).toContain('B')
    expect(wrapper.text()).toContain('C')
  })

  it('traduit les statuts en français', () => {
    const wrapper = mount(DataFlowStatus, {
      props: {
        flows: [
          mkFlow({ status: 'active' }),
          mkFlow({ name: 'X', status: 'inactive' }),
          mkFlow({ name: 'Y', status: 'error' }),
        ],
      },
    })
    expect(wrapper.text()).toContain('Actif')
    expect(wrapper.text()).toContain('Inactif')
    expect(wrapper.text()).toContain('Erreur')
  })

  it('applique la classe selon le status sur la flow-card', () => {
    const wrapper = mount(DataFlowStatus, {
      props: { flows: [mkFlow({ status: 'error' })] },
    })
    expect(wrapper.find('.flow-card.status-error').exists()).toBe(true)
  })

  it('classe d erreur "error-low" si <1%', () => {
    const wrapper = mount(DataFlowStatus, { props: { flows: [mkFlow({ errorRate: 0.2 })] } })
    expect(wrapper.find('.error-low').exists()).toBe(true)
  })

  it('classe d erreur "error-medium" si entre 1 et 5%', () => {
    const wrapper = mount(DataFlowStatus, { props: { flows: [mkFlow({ errorRate: 2.5 })] } })
    expect(wrapper.find('.error-medium').exists()).toBe(true)
  })

  it('classe d erreur "error-high" si >=5%', () => {
    const wrapper = mount(DataFlowStatus, { props: { flows: [mkFlow({ errorRate: 8 })] } })
    expect(wrapper.find('.error-high').exists()).toBe(true)
  })

  it('ne crash pas avec une liste vide', () => {
    const wrapper = mount(DataFlowStatus, { props: { flows: [] } })
    expect(wrapper.findAll('.flow-card')).toHaveLength(0)
  })
})
