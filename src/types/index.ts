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

// Utilisateur de l'interface d'administration
export interface AdminUser {
  id: string
  username: string
  role: 'admin' | 'validator' | 'viewer'
  email: string
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
