import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MealCalendar from '../MealCalendar.vue'
import type { DayPlan } from '@/services/aiNutritionApi'

function makeMeal(name: string, overrides: Partial<DayPlan['breakfast']> = {}) {
  return {
    name,
    macros: { calories: 420, protein_g: 18, carbs_g: 68, fat_g: 9 },
    ingredients: ['ingrédient A', 'ingrédient B'],
    budget_eur: 1.8,
    prep_time_min: 10,
    ...overrides,
  }
}

const SAMPLE_DAYS: DayPlan[] = [
  {
    day: 1,
    breakfast: makeMeal('Porridge banane'),
    lunch: makeMeal('Bowl quinoa', { budget_eur: 4.5, prep_time_min: 25 }),
    dinner: makeMeal('Saumon vapeur', { budget_eur: 6.2, prep_time_min: 30 }),
  },
  {
    day: 2,
    breakfast: makeMeal('Pancakes flocons'),
    lunch: makeMeal('Salade thon'),
    dinner: makeMeal('Poulet riz brocoli'),
  },
]

describe('MealCalendar', () => {
  it('renders one panel per day with the day label', () => {
    const wrapper = mount(MealCalendar, { props: { days: SAMPLE_DAYS } })

    const panels = wrapper.findAll('[data-testid="meal-day"]')
    expect(panels).toHaveLength(2)
    expect(panels[0].text()).toMatch(/jour\s*1/i)
    expect(panels[1].text()).toMatch(/jour\s*2/i)
  })

  it('renders the three meal slots (breakfast, lunch, dinner) per day', () => {
    const wrapper = mount(MealCalendar, { props: { days: [SAMPLE_DAYS[0]] } })

    const text = wrapper.text().toLowerCase()
    expect(text).toContain('petit-déjeuner')
    expect(text).toContain('déjeuner')
    expect(text).toContain('dîner')
  })

  it('shows each meal name', () => {
    const wrapper = mount(MealCalendar, { props: { days: [SAMPLE_DAYS[0]] } })

    const text = wrapper.text()
    expect(text).toContain('Porridge banane')
    expect(text).toContain('Bowl quinoa')
    expect(text).toContain('Saumon vapeur')
  })

  it('shows macros (calories, protein, carbs, fat) for each meal', () => {
    const wrapper = mount(MealCalendar, { props: { days: [SAMPLE_DAYS[0]] } })

    const breakfast = wrapper.find('[data-testid="meal-breakfast"]')
    expect(breakfast.text()).toContain('420')
    expect(breakfast.text()).toContain('18')
    expect(breakfast.text()).toContain('68')
    expect(breakfast.text()).toContain('9')
  })

  it('lists the ingredients per meal', () => {
    const wrapper = mount(MealCalendar, { props: { days: [SAMPLE_DAYS[0]] } })

    const breakfast = wrapper.find('[data-testid="meal-breakfast"]')
    expect(breakfast.text()).toContain('ingrédient A')
    expect(breakfast.text()).toContain('ingrédient B')
  })

  it('shows the budget and prep time per meal', () => {
    const wrapper = mount(MealCalendar, { props: { days: [SAMPLE_DAYS[0]] } })

    const lunch = wrapper.find('[data-testid="meal-lunch"]')
    expect(lunch.text()).toContain('4.5')
    expect(lunch.text()).toMatch(/25\s*min/i)
  })

  it('exposes a grid wrapper that responsive CSS can target', () => {
    const wrapper = mount(MealCalendar, { props: { days: SAMPLE_DAYS } })

    expect(wrapper.find('[data-testid="meal-calendar-grid"]').exists()).toBe(true)
  })

  it('renders nothing when given an empty array', () => {
    const wrapper = mount(MealCalendar, { props: { days: [] } })

    expect(wrapper.findAll('[data-testid="meal-day"]')).toHaveLength(0)
  })
})
