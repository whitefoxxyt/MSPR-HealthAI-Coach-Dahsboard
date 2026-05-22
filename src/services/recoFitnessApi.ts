import { authSessionManager } from '@/services/auth'
import { ApiError, parseJsonOrThrow } from '@/services/apiError'

const RECO_FITNESS_BASE_URL =
  import.meta.env.VITE_RECO_FITNESS_BASE_URL || 'http://localhost:8002'

export type HealthGoalFitness =
  | 'fat_loss'
  | 'muscle_strength'
  | 'endurance'
  | 'general_health'

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced'

export interface SessionPreferences {
  duration_min_per_session: number
  sessions_per_week: number
}

export interface FitnessProfile {
  user_id: string
  health_goal_fitness: HealthGoalFitness
  experience_level: ExperienceLevel
  equipment: string[]
  limitations: string[]
  preferences: SessionPreferences
  updated_at: string
}

export interface FitnessProfileUpdate {
  health_goal_fitness: HealthGoalFitness
  experience_level: ExperienceLevel
  equipment: string[]
  limitations: string[]
  preferences: SessionPreferences
}

export type ScoringStrategy = 'rule_based' | 'hybrid_rank_fusion'
export type EntitlementTier = 'free' | 'premium' | 'premium_plus'

export interface ExerciseInProgram {
  id: number
  name: string
  target_muscles: string[]
  equipment: string[]
  difficulty: string
  category: string | null
}

export type ProgramSession = ExerciseInProgram[]
export type ProgramWeek = ProgramSession[]

export interface WorkoutProgram {
  program_id: string
  user_id: string
  duration_weeks: number
  scoring_strategy: ScoringStrategy
  tier_at_generation: EntitlementTier
  health_goal_at_generation: HealthGoalFitness
  duration_min_per_session: number
  weeks: ProgramWeek[]
  created_at: string
}

export interface WorkoutProgramListResponse {
  items: WorkoutProgram[]
  total: number
  limit: number
  offset: number
}

function authHeaders(): Record<string, string> {
  const token = authSessionManager.getAccessToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export const recoFitnessApi = {
  async getFitnessProfile(): Promise<FitnessProfile | null> {
    const response = await fetch(`${RECO_FITNESS_BASE_URL}/api/v1/fitness-profile/me`, {
      method: 'GET',
      headers: authHeaders(),
    })
    if (response.status === 404) {
      return null
    }
    return parseJsonOrThrow<FitnessProfile>(response)
  },

  async updateFitnessProfile(payload: FitnessProfileUpdate): Promise<FitnessProfile> {
    const response = await fetch(`${RECO_FITNESS_BASE_URL}/api/v1/fitness-profile/me`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    })
    return parseJsonOrThrow<FitnessProfile>(response)
  },

  async generateProgram(): Promise<WorkoutProgram> {
    const response = await fetch(`${RECO_FITNESS_BASE_URL}/api/v1/recommendations`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({}),
    })
    return parseJsonOrThrow<WorkoutProgram>(response)
  },

  async listPrograms(limit: number, offset: number): Promise<WorkoutProgramListResponse> {
    const url = `${RECO_FITNESS_BASE_URL}/api/v1/programs/me?limit=${limit}&offset=${offset}`
    const response = await fetch(url, {
      method: 'GET',
      headers: authHeaders(),
    })
    return parseJsonOrThrow<WorkoutProgramListResponse>(response)
  },
}

export { ApiError }
