import { describe, it, expect } from 'vitest'
import { fitnessGoalTag } from '../fitnessGoals'

describe('fitnessGoalTag', () => {
  it('maps muscle_strength to "Force"', () => {
    expect(fitnessGoalTag('muscle_strength')).toBe('Force')
  })

  it('maps fat_loss to "Cardio"', () => {
    expect(fitnessGoalTag('fat_loss')).toBe('Cardio')
  })

  it('maps endurance to "Endurance"', () => {
    expect(fitnessGoalTag('endurance')).toBe('Endurance')
  })

  it('maps general_health to "Santé"', () => {
    expect(fitnessGoalTag('general_health')).toBe('Santé')
  })

  it('returns "Personnalisé" when no goal is provided', () => {
    expect(fitnessGoalTag(undefined)).toBe('Personnalisé')
  })
})
