import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MacrosGrid from '../MacrosGrid.vue'

describe('MacrosGrid', () => {
  it('renders the 5 macro cells with their values', () => {
    const wrapper = mount(MacrosGrid, {
      props: {
        macros: {
          calories: 540,
          protein_g: 38,
          carbs_g: 52,
          fat_g: 18,
          fiber_g: 4,
        },
      },
    })

    const text = wrapper.text()
    expect(text).toContain('540')
    expect(text).toContain('kcal')
    expect(text).toContain('38')
    expect(text).toContain('52')
    expect(text).toContain('18')
    expect(text).toContain('4')
    expect(wrapper.text().toLowerCase()).toContain('protéines')
    expect(wrapper.text().toLowerCase()).toContain('glucides')
    expect(wrapper.text().toLowerCase()).toContain('lipides')
    expect(wrapper.text().toLowerCase()).toContain('fibres')
  })

  it('uses each cell as a labelled data point via data-testid', () => {
    const wrapper = mount(MacrosGrid, {
      props: {
        macros: {
          calories: 540,
          protein_g: 38,
          carbs_g: 52,
          fat_g: 18,
          fiber_g: 4,
        },
      },
    })

    expect(wrapper.find('[data-testid="macros-calories"]').text()).toContain('540')
    expect(wrapper.find('[data-testid="macros-protein"]').text()).toContain('38')
    expect(wrapper.find('[data-testid="macros-carbs"]').text()).toContain('52')
    expect(wrapper.find('[data-testid="macros-fat"]').text()).toContain('18')
    expect(wrapper.find('[data-testid="macros-fiber"]').text()).toContain('4')
  })

  it('shows "—" when macros is null', () => {
    const wrapper = mount(MacrosGrid, { props: { macros: null } })

    expect(wrapper.find('[data-testid="macros-calories"]').text()).toContain('—')
    expect(wrapper.find('[data-testid="macros-protein"]').text()).toContain('—')
    expect(wrapper.find('[data-testid="macros-carbs"]').text()).toContain('—')
    expect(wrapper.find('[data-testid="macros-fat"]').text()).toContain('—')
    expect(wrapper.find('[data-testid="macros-fiber"]').text()).toContain('—')
  })

  it('shows "—" for individual fields when their value is null or undefined', () => {
    const wrapper = mount(MacrosGrid, {
      props: {
        macros: {
          calories: 540,
          protein_g: null,
          carbs_g: 52,
          fat_g: null,
          fiber_g: null,
        } as never,
      },
    })

    expect(wrapper.find('[data-testid="macros-calories"]').text()).toContain('540')
    expect(wrapper.find('[data-testid="macros-protein"]').text()).toContain('—')
    expect(wrapper.find('[data-testid="macros-carbs"]').text()).toContain('52')
    expect(wrapper.find('[data-testid="macros-fat"]').text()).toContain('—')
    expect(wrapper.find('[data-testid="macros-fiber"]').text()).toContain('—')
  })

  it('rounds decimal macros to whole grams', () => {
    const wrapper = mount(MacrosGrid, {
      props: {
        macros: {
          calories: 540.7,
          protein_g: 38.4,
          carbs_g: 52.6,
          fat_g: 18.5,
          fiber_g: 4.1,
        },
      },
    })

    expect(wrapper.find('[data-testid="macros-calories"]').text()).toContain('541')
    expect(wrapper.find('[data-testid="macros-protein"]').text()).toContain('38')
    expect(wrapper.find('[data-testid="macros-carbs"]').text()).toContain('53')
    expect(wrapper.find('[data-testid="macros-fat"]').text()).toContain('19')
    expect(wrapper.find('[data-testid="macros-fiber"]').text()).toContain('4')
  })
})
