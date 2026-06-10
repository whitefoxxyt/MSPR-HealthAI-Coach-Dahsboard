import { describe, expect, it } from 'vitest'
import { formatExerciseName } from '../exerciseName'

describe('formatExerciseName', () => {
  it('capitalise chaque mot significatif', () => {
    expect(formatExerciseName('barbell reverse grip incline bench row')).toBe(
      'Barbell Reverse Grip Incline Bench Row',
    )
  })

  it('conserve la ponctuation et capitalise dans les parenthèses', () => {
    expect(formatExerciseName('cable one arm high row (kneeling)')).toBe(
      'Cable One Arm High Row (Kneeling)',
    )
  })

  it('garde les mots de liaison en minuscules sauf en tête', () => {
    expect(formatExerciseName('dumbbell side plank with rear fly')).toBe(
      'Dumbbell Side Plank with Rear Fly',
    )
  })

  it('capitalise les mots composés', () => {
    expect(formatExerciseName('dumbbell bent-over row')).toBe('Dumbbell Bent-Over Row')
  })

  it('retourne une chaîne vide pour les valeurs absentes', () => {
    expect(formatExerciseName(null)).toBe('')
    expect(formatExerciseName(undefined)).toBe('')
  })
})
