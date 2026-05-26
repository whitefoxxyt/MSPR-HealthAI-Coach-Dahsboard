import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import MetricsCard from '../MetricsCard.vue'

beforeEach(() => {
  // animation skipping: requestAnimationFrame qui tire immédiatement
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    cb(Date.now() + 5000) // injecte une grande durée pour finir l animation
    return 1
  })
  vi.stubGlobal('cancelAnimationFrame', () => {})
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('MetricsCard', () => {
  it('rend le title et la value numérique formatée', () => {
    const wrapper = mount(MetricsCard, {
      props: { title: 'Total utilisateurs', value: 1234 },
      global: { stubs: { FontAwesomeIcon: true } },
    })
    expect(wrapper.find('.metrics-card__title').text()).toBe('Total utilisateurs')
    expect(wrapper.find('.metrics-card__value').text()).toMatch(/1[\s ,.]?234/)
  })

  it('rend la value string telle quelle', () => {
    const wrapper = mount(MetricsCard, {
      props: { title: 't', value: '∞' },
      global: { stubs: { FontAwesomeIcon: true } },
    })
    expect(wrapper.find('.metrics-card__value').text()).toBe('∞')
  })

  it('formate en pourcentage quand isPercentage=true', () => {
    const wrapper = mount(MetricsCard, {
      props: { title: 't', value: 42, isPercentage: true },
      global: { stubs: { FontAwesomeIcon: true } },
    })
    expect(wrapper.find('.metrics-card__value').text()).toMatch(/%/)
  })

  it('rend le subtitle quand fourni', () => {
    const wrapper = mount(MetricsCard, {
      props: { title: 't', value: 1, subtitle: 'sub' },
      global: { stubs: { FontAwesomeIcon: true } },
    })
    expect(wrapper.find('.metrics-card__subtitle').text()).toBe('sub')
  })

  it('applique la classe correspondant au variant', () => {
    const wrapper = mount(MetricsCard, {
      props: { title: 't', value: 1, variant: 'danger' },
      global: { stubs: { FontAwesomeIcon: true } },
    })
    expect(wrapper.find('.metrics-card').classes()).toContain('danger')
  })

  it('affiche le trend uniquement si trend est fourni', async () => {
    const wrapper = mount(MetricsCard, {
      props: { title: 't', value: 1 },
      global: { stubs: { FontAwesomeIcon: true } },
    })
    expect(wrapper.find('.metrics-card__trend').exists()).toBe(false)

    await wrapper.setProps({ trend: '+10%', trendDirection: 'up' })
    expect(wrapper.find('.metrics-card__trend').exists()).toBe(true)
    expect(wrapper.find('.trend-up').exists()).toBe(true)
  })

  it('applique la classe trend-down et le label associé', () => {
    const wrapper = mount(MetricsCard, {
      props: { title: 't', value: 1, trend: '-5%', trendDirection: 'down' },
      global: { stubs: { FontAwesomeIcon: true } },
    })
    expect(wrapper.find('.trend-down').exists()).toBe(true)
  })

  it('défaut trend-neutral si pas de direction', () => {
    const wrapper = mount(MetricsCard, {
      props: { title: 't', value: 1, trend: 'stable' },
      global: { stubs: { FontAwesomeIcon: true } },
    })
    expect(wrapper.find('.trend-neutral').exists()).toBe(true)
  })

  it('met à jour l affichage quand value change (anim)', async () => {
    const wrapper = mount(MetricsCard, {
      props: { title: 't', value: 10 },
      global: { stubs: { FontAwesomeIcon: true } },
    })
    await wrapper.setProps({ value: 50 })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.metrics-card__value').text()).toContain('50')
  })

  it('démontage: annule la requestAnimationFrame en cours sans crasher', () => {
    const wrapper = mount(MetricsCard, {
      props: { title: 't', value: 1 },
      global: { stubs: { FontAwesomeIcon: true } },
    })
    expect(() => wrapper.unmount()).not.toThrow()
  })
})
