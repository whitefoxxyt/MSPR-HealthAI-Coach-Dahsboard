import type { HealthGoalFitness } from '@/services/recoFitnessApi'

export function fitnessGoalTag(goal: HealthGoalFitness | undefined): string {
  switch (goal) {
    case 'muscle_strength':
      return 'Force'
    case 'fat_loss':
      return 'Cardio'
    case 'endurance':
      return 'Endurance'
    case 'general_health':
      return 'Santé'
    default:
      return 'Personnalisé'
  }
}
