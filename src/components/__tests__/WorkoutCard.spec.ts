import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import WorkoutCard from '../WorkoutCard.vue'

const EXERCISE = {
  id: 12,
  name: 'Bench Press',
  target_muscles: ['chest', 'triceps'],
  equipment: ['barbell', 'bench'],
  difficulty: 'intermediate',
  category: 'compound',
  gif_url: null,
}

describe('WorkoutCard', () => {
  it('renders the exercise name', () => {
    const wrapper = mount(WorkoutCard, { props: { exercise: EXERCISE, position: 1 } })

    expect(wrapper.text()).toContain('Bench Press')
  })

  it('renders the position number', () => {
    const wrapper = mount(WorkoutCard, { props: { exercise: EXERCISE, position: 3 } })

    expect(wrapper.text()).toContain('03')
  })

  it('renders the target muscles', () => {
    const wrapper = mount(WorkoutCard, { props: { exercise: EXERCISE, position: 1 } })

    expect(wrapper.text()).toContain('chest')
    expect(wrapper.text()).toContain('triceps')
  })

  it('renders the equipment list', () => {
    const wrapper = mount(WorkoutCard, { props: { exercise: EXERCISE, position: 1 } })

    expect(wrapper.text()).toContain('barbell')
    expect(wrapper.text()).toContain('bench')
  })

  it('renders the difficulty', () => {
    const wrapper = mount(WorkoutCard, { props: { exercise: EXERCISE, position: 1 } })

    expect(wrapper.text().toLowerCase()).toContain('intermediate')
  })

  it('falls back to a placeholder when no equipment is required', () => {
    const wrapper = mount(WorkoutCard, {
      props: {
        exercise: { ...EXERCISE, equipment: [] },
        position: 1,
      },
    })

    expect(wrapper.text().toLowerCase()).toMatch(/sans mat[eé]riel|aucun/)
  })
})
