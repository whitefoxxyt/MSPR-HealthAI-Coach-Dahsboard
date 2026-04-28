/**
 * Types et interfaces pour le dashboard HealthAI Coach
 */

// Statut de validation des données
export type ValidationStatus = 'pending' | 'approved' | 'rejected'

// Type d'anomalie détectée
export type AnomalyType = 'missing_value' | 'duplicate' | 'outlier' | 'format_error'

// Statut des flux de données
export type DataFlowStatus = 'active' | 'inactive' | 'error'

// Métriques de qualité des données
export interface DataQualityMetrics {
  totalRecords: number
  missingValues: number
  duplicates: number
  anomalies: number
  completenessRate: number
  dataFlowStatus: DataFlowStatus
  lastUpdate: string
}

// Anomalie détectée dans les données
export interface DataAnomaly {
  id: string
  type: AnomalyType
  entityType: 'user' | 'nutrition' | 'exercise' | 'biometric'
  entityId: string
  field: string
  currentValue: string | null
  suggestedValue?: string
  detectedAt: string
  severity: 'low' | 'medium' | 'high'
  status: ValidationStatus
}

// Enregistrement de données à valider
export interface DataRecord {
  id: string
  type: 'user' | 'nutrition' | 'exercise' | 'biometric'
  data: Record<string, unknown>
  status: ValidationStatus
  createdAt: string
  updatedAt: string
  validatedBy?: string
  validatedAt?: string
}

// Utilisateur authentifié de l'application
export type UserRole = 'admin' | 'validator' | 'viewer' | 'user'

export interface AuthUser {
  id: string
  username: string
  role: UserRole
  email: string
}

// Alias conservé pour compatibilité avec le code admin existant
export type AdminUser = AuthUser

// Tokens de session d'administration
export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresAt: string
}

// Session d'authentification persistée localement
export interface AuthSession {
  user: AuthUser
  tokens: AuthTokens
}

// Statistiques des flux de données
export interface DataFlowStats {
  name: string
  type: 'user' | 'nutrition' | 'exercise' | 'biometric'
  status: DataFlowStatus
  recordsToday: number
  lastSync: string
  errorRate: number
}

export type AnalyticsPeriod = '7d' | '30d' | '90d'

export interface AnalyticsDistributionItem {
  label: string
  value: number
}

export interface AnalyticsTrendPoint {
  label: string
  value: number
}

export interface NutritionBalanceByProfile {
  profile: string
  deficit: number
  excess: number
}

export interface BusinessKpis {
  engagementRate: number
  premiumConversionRate: number
  satisfactionRate: number
}

export interface AnalyticsOverview {
  ageDistribution: AnalyticsDistributionItem[]
  objectiveDistribution: AnalyticsDistributionItem[]
  progressionRateByPeriod: Record<AnalyticsPeriod, number>
  userProgressionTrend: Record<AnalyticsPeriod, AnalyticsTrendPoint[]>
  foodTrends: Record<AnalyticsPeriod, AnalyticsTrendPoint[]>
  nutritionBalanceByProfile: NutritionBalanceByProfile[]
  topExercises: AnalyticsDistributionItem[]
  intensityLevels: AnalyticsDistributionItem[]
  businessKpis: BusinessKpis
}

// Options d'export
export interface ExportOptions {
  format: 'json' | 'csv'
  includeMetadata: boolean
  dateRange?: {
    start: string
    end: string
  }
  entityTypes?: Array<'user' | 'nutrition' | 'exercise' | 'biometric'>
}

// Pagination
export interface PaginationParams {
  page: number
  pageSize: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// Réponse paginée
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface UserDashboardMetrics {
  streakDays: number
  weeklyGoalProgress: number
  hydrationProgress: number
  caloriesConsumed: number
  caloriesTarget: number
}

export interface UserProfile {
  id: string
  fullName: string
  email: string
  objective: string
  age: number
  heightCm: number
  weightKg: number
  dailyCalorieTarget: number
  dailyHydrationTargetLiters: number
}

export interface TrendPoint {
  label: string
  value: number
}

export interface MacroDistribution {
  label: 'Protéines' | 'Glucides' | 'Lipides'
  value: number
}

export interface NutritionSummary {
  date: string
  consumedCalories: number
  targetCalories: number
  proteinGrams: number
  carbsGrams: number
  fatsGrams: number
  hydrationLiters: number
  hydrationTargetLiters: number
  mealCount: number
  adherenceRate: number
  weeklyCaloriesTrend: TrendPoint[]
  macroDistribution: MacroDistribution[]
}

export interface ActivitySummary {
  date: string
  steps: number
  stepsTarget: number
  activeMinutes: number
  workoutCount: number
  caloriesBurned: number
  weeklyStepsTrend: TrendPoint[]
  intensityDistribution: Array<{
    label: 'Faible' | 'Modérée' | 'Élevée'
    value: number
  }>
}
