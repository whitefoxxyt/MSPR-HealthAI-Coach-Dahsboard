import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ProgramSummary from '../ProgramSummary.vue'

function exercise(id: number) {
  return {
    id,
    name: `Exercise ${id}`,
    target_muscles: ['chest'],
    equipment: ['dumbbell'],
    difficulty: 'intermediate',
    category: 'compound',
  }
}

const PROGRAM = {
  program_id: 'prog-123',
  user_id: 'user-1',
  duration_weeks: 4,
  scoring_strategy: 'hybrid_rank_fusion' as const,
  tier_at_generation: 'premium' as const,
  health_goal_at_generation: 'muscle_strength' as const,
  duration_min_per_session: 60,
  weeks: [
    [[exercise(1), exercise(2)], [exercise(3)]],
    [[exercise(4)], [exercise(5), exercise(6)]],
  ],
  created_at: '2026-05-22T12:00:00Z',
}

describe('ProgramSummary', () => {
  it('renders the program identifier in the title', () => {
    const wrapper = mount(ProgramSummary, { props: { program: PROGRAM, tag: 'Force' } })

    expect(wrapper.text()).toContain('prog-123')
  })

  it('renders the tag passed as a prop', () => {
    const wrapper = mount(ProgramSummary, { props: { program: PROGRAM, tag: 'Endurance' } })

    expect(wrapper.text()).toContain('Endurance')
  })

  it('shows the duration in weeks', () => {
    const wrapper = mount(ProgramSummary, { props: { program: PROGRAM, tag: 'Force' } })

    expect(wrapper.text()).toContain('4')
    expect(wrapper.text().toLowerCase()).toMatch(/semaine/)
  })

  it('computes the total number of exercises across every session of every week', () => {
    const wrapper = mount(ProgramSummary, { props: { program: PROGRAM, tag: 'Force' } })

    expect(wrapper.find('[data-testid="program-total-exercises"]').text()).toContain('6')
  })

  it('computes the total number of sessions across every week', () => {
    const wrapper = mount(ProgramSummary, { props: { program: PROGRAM, tag: 'Force' } })

    expect(wrapper.find('[data-testid="program-total-sessions"]').text()).toContain('4')
  })

  it('shows the scoring strategy in the footer', () => {
    const wrapper = mount(ProgramSummary, { props: { program: PROGRAM, tag: 'Force' } })

    expect(wrapper.find('[data-testid="program-scoring-strategy"]').text()).toContain(
      'hybrid_rank_fusion',
    )
  })
})
