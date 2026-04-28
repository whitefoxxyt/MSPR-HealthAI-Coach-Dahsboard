/**
 * Service API pour communiquer avec le backend.
 * Utilise un mode mock par défaut pour accélérer le développement frontend.
 */

import type {
  ActivitySummary,
  AnalyticsOverview,
  DataAnomaly,
  DataFlowStats,
  DataQualityMetrics,
  DataRecord,
  ExportOptions,
  NutritionSummary,
  PaginatedResponse,
  PaginationParams,
  UserDashboardMetrics,
  UserProfile,
  ValidationStatus,
} from '@/types'
import { authSessionManager } from '@/services/auth'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

export class ApiError extends Error {
  status: number
  statusText: string
  payload: unknown

  constructor(status: number, statusText: string, message: string, payload: unknown = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.statusText = statusText
    this.payload = payload
  }
}

function buildQuery<T extends object>(params?: T): string {
  if (!params) return ''
  const query = new URLSearchParams()
  Object.entries(params as Record<string, unknown>).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      query.set(key, String(value))
    }
  })
  const asString = query.toString()
  return asString ? `?${asString}` : ''
}

async function parseErrorPayload(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    return response.json()
  }
  return response.text()
}

function getStatusMessage(status: number): string {
  if (status === 401) return 'Session invalide ou expirée. Veuillez vous reconnecter.'
  if (status === 403) return 'Action non autorisée.'
  if (status === 404) return 'Ressource non trouvée.'
  if (status >= 500) return 'Erreur serveur. Merci de réessayer plus tard.'
  return 'Erreur API.'
}

class ApiClient {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    const accessToken = authSessionManager.getAccessToken()

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...options.headers,
      },
    })

    if (!response.ok) {
      const payload = await parseErrorPayload(response)
      throw new ApiError(response.status, response.statusText, getStatusMessage(response.status), payload)
    }

    if (response.status === 204) {
      return undefined as T
    }

    return response.json() as Promise<T>
  }

  get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  post<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body: JSON.stringify(data) })
  }

  put<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', body: JSON.stringify(data) })
  }

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
}

const apiClient = new ApiClient()

const mockData = {
  metrics: {
    totalRecords: 15847,
    missingValues: 234,
    duplicates: 67,
    anomalies: 142,
    completenessRate: 95.2,
    dataFlowStatus: 'active' as const,
    lastUpdate: new Date().toISOString(),
  },
  anomalies: [
    {
      id: 'anom-1',
      type: 'missing_value' as const,
      entityType: 'user' as const,
      entityId: 'user-123',
      field: 'birthDate',
      currentValue: null,
      detectedAt: '2026-04-06T10:30:00Z',
      severity: 'high' as const,
      status: 'pending' as const,
    },
    {
      id: 'anom-2',
      type: 'duplicate' as const,
      entityType: 'nutrition' as const,
      entityId: 'nutri-456',
      field: 'productName',
      currentValue: 'Pomme Golden',
      suggestedValue: 'Pomme',
      detectedAt: '2026-04-06T09:15:00Z',
      severity: 'medium' as const,
      status: 'pending' as const,
    },
    {
      id: 'anom-3',
      type: 'outlier' as const,
      entityType: 'biometric' as const,
      entityId: 'bio-789',
      field: 'heartRate',
      currentValue: '250',
      suggestedValue: '75',
      detectedAt: '2026-04-06T08:00:00Z',
      severity: 'high' as const,
      status: 'pending' as const,
    },
  ] as DataAnomaly[],
  dataFlows: [
    {
      name: 'Profils utilisateurs',
      type: 'user' as const,
      status: 'active' as const,
      recordsToday: 145,
      lastSync: '2026-04-07T06:30:00Z',
      errorRate: 0.5,
    },
    {
      name: 'Données nutritionnelles',
      type: 'nutrition' as const,
      status: 'active' as const,
      recordsToday: 892,
      lastSync: '2026-04-07T06:45:00Z',
      errorRate: 1.2,
    },
    {
      name: 'Catalogues d\'exercices',
      type: 'exercise' as const,
      status: 'active' as const,
      recordsToday: 234,
      lastSync: '2026-04-07T06:40:00Z',
      errorRate: 0.3,
    },
    {
      name: 'Métriques biométriques',
      type: 'biometric' as const,
      status: 'error' as const,
      recordsToday: 0,
      lastSync: '2026-04-07T02:15:00Z',
      errorRate: 15.7,
    },
  ] as DataFlowStats[],
  analytics: {
    ageDistribution: [
      { label: '18-25 ans', value: 24 },
      { label: '26-35 ans', value: 38 },
      { label: '36-50 ans', value: 26 },
      { label: '50+ ans', value: 12 },
    ],
    objectiveDistribution: [
      { label: 'Perte de poids', value: 41 },
      { label: 'Masse musculaire', value: 27 },
      { label: 'Forme générale', value: 22 },
      { label: 'Santé métabolique', value: 10 },
    ],
    progressionRateByPeriod: { '7d': 62.4, '30d': 74.8, '90d': 81.3 },
    userProgressionTrend: {
      '7d': [
        { label: 'J-6', value: 55 },
        { label: 'J-5', value: 56 },
        { label: 'J-4', value: 58 },
        { label: 'J-3', value: 59 },
        { label: 'J-2', value: 60 },
        { label: 'J-1', value: 61 },
        { label: 'J', value: 62.4 },
      ],
      '30d': [
        { label: 'S1', value: 61 },
        { label: 'S2', value: 66 },
        { label: 'S3', value: 70 },
        { label: 'S4', value: 74.8 },
      ],
      '90d': [
        { label: 'M-3', value: 64 },
        { label: 'M-2', value: 72 },
        { label: 'M-1', value: 77 },
        { label: 'M', value: 81.3 },
      ],
    },
    foodTrends: {
      '7d': [
        { label: 'Lun', value: 68 },
        { label: 'Mar', value: 71 },
        { label: 'Mer', value: 73 },
        { label: 'Jeu', value: 70 },
        { label: 'Ven', value: 74 },
        { label: 'Sam', value: 72 },
        { label: 'Dim', value: 76 },
      ],
      '30d': [
        { label: 'S1', value: 67 },
        { label: 'S2', value: 69 },
        { label: 'S3', value: 72 },
        { label: 'S4', value: 75 },
      ],
      '90d': [
        { label: 'M-3', value: 65 },
        { label: 'M-2', value: 70 },
        { label: 'M-1', value: 73 },
        { label: 'M', value: 76 },
      ],
    },
    nutritionBalanceByProfile: [
      { profile: 'Perte de poids', deficit: 31, excess: 12 },
      { profile: 'Masse musculaire', deficit: 18, excess: 23 },
      { profile: 'Forme générale', deficit: 14, excess: 17 },
      { profile: 'Santé métabolique', deficit: 22, excess: 15 },
    ],
    topExercises: [
      { label: 'Marche rapide', value: 4620 },
      { label: 'Renforcement', value: 3575 },
      { label: 'Vélo', value: 2840 },
      { label: 'Yoga', value: 2130 },
      { label: 'Course', value: 1985 },
    ],
    intensityLevels: [
      { label: 'Faible', value: 34 },
      { label: 'Modérée', value: 46 },
      { label: 'Élevée', value: 20 },
    ],
    businessKpis: { engagementRate: 72.6, premiumConversionRate: 18.4, satisfactionRate: 91.2 },
  } as AnalyticsOverview,
  records: [
    {
      id: 'rec-1',
      type: 'user' as const,
      data: {
        firstName: 'Jean',
        lastName: 'Dupont',
        email: 'jean.dupont@example.com',
        birthDate: '1985-03-15',
      },
      status: 'pending' as const,
      createdAt: '2026-04-07T05:00:00Z',
      updatedAt: '2026-04-07T05:00:00Z',
    },
    {
      id: 'rec-2',
      type: 'nutrition' as const,
      data: {
        name: 'Banane',
        calories: 89,
        proteins: 1.1,
        carbs: 22.8,
        fats: 0.3,
      },
      status: 'approved' as const,
      createdAt: '2026-04-06T14:20:00Z',
      updatedAt: '2026-04-06T15:30:00Z',
      validatedBy: 'admin-1',
      validatedAt: '2026-04-06T15:30:00Z',
    },
  ] as DataRecord[],
  userProfile: {
    id: 'user-42',
    fullName: 'Marie Martin',
    email: 'marie@healthai.test',
    objective: 'Perte de poids',
    age: 31,
    heightCm: 168,
    weightKg: 66,
    dailyCalorieTarget: 1900,
    dailyHydrationTargetLiters: 2.2,
  } as UserProfile,
  userMetrics: {
    streakDays: 12,
    weeklyGoalProgress: 78,
    hydrationProgress: 86,
    caloriesConsumed: 1720,
    caloriesTarget: 1900,
  } as UserDashboardMetrics,
  nutritionSummary: {
    date: new Date().toISOString(),
    consumedCalories: 1720,
    targetCalories: 1900,
    proteinGrams: 96,
    carbsGrams: 174,
    fatsGrams: 62,
    hydrationLiters: 1.9,
    hydrationTargetLiters: 2.2,
    mealCount: 4,
    adherenceRate: 90,
    weeklyCaloriesTrend: [
      { label: 'Lun', value: 1800 },
      { label: 'Mar', value: 1920 },
      { label: 'Mer', value: 1760 },
      { label: 'Jeu', value: 1840 },
      { label: 'Ven', value: 1720 },
      { label: 'Sam', value: 1890 },
      { label: 'Dim', value: 1700 },
    ],
    macroDistribution: [
      { label: 'Protéines', value: 28 },
      { label: 'Glucides', value: 44 },
      { label: 'Lipides', value: 28 },
    ],
  } as NutritionSummary,
  activitySummary: {
    date: new Date().toISOString(),
    steps: 8450,
    stepsTarget: 10000,
    activeMinutes: 56,
    workoutCount: 1,
    caloriesBurned: 480,
    weeklyStepsTrend: [
      { label: 'Lun', value: 7100 },
      { label: 'Mar', value: 8100 },
      { label: 'Mer', value: 9500 },
      { label: 'Jeu', value: 10200 },
      { label: 'Ven', value: 8450 },
      { label: 'Sam', value: 9300 },
      { label: 'Dim', value: 7800 },
    ],
    intensityDistribution: [
      { label: 'Faible', value: 35 },
      { label: 'Modérée', value: 45 },
      { label: 'Élevée', value: 20 },
    ],
  } as ActivitySummary,
}

export const dataQualityApi = {
  async getMetrics(): Promise<DataQualityMetrics> {
    if (USE_MOCK) return Promise.resolve(mockData.metrics)
    return apiClient.get<DataQualityMetrics>('/data-quality/metrics')
  },

  async getAnomalies(params?: PaginationParams): Promise<PaginatedResponse<DataAnomaly>> {
    if (USE_MOCK) {
      const data = mockData.anomalies
      const page = params?.page || 1
      const pageSize = params?.pageSize || 10
      return Promise.resolve({
        data,
        total: data.length,
        page,
        pageSize,
        totalPages: Math.ceil(data.length / pageSize),
      })
    }
    return apiClient.get<PaginatedResponse<DataAnomaly>>(
      `/data-quality/anomalies${buildQuery(params)}`,
    )
  },

  async getDataFlowStats(): Promise<DataFlowStats[]> {
    if (USE_MOCK) return Promise.resolve(mockData.dataFlows)
    return apiClient.get<DataFlowStats[]>('/data-quality/flows')
  },

  async getAnalyticsOverview(): Promise<AnalyticsOverview> {
    if (USE_MOCK) return Promise.resolve(mockData.analytics)
    return apiClient.get<AnalyticsOverview>('/analytics/overview')
  },

  async updateAnomaly(id: string, data: Partial<DataAnomaly>): Promise<DataAnomaly> {
    if (USE_MOCK) {
      const anomaly = mockData.anomalies.find((a) => a.id === id)
      if (!anomaly) throw new Error('Anomaly not found')
      return Promise.resolve({ ...anomaly, ...data })
    }
    return apiClient.put<DataAnomaly>(`/data-quality/anomalies/${id}`, data)
  },

  async deleteAnomaly(id: string): Promise<void> {
    if (USE_MOCK) {
      const index = mockData.anomalies.findIndex((a) => a.id === id)
      if (index !== -1) mockData.anomalies.splice(index, 1)
      return Promise.resolve()
    }
    return apiClient.delete<void>(`/data-quality/anomalies/${id}`)
  },
}

export const validationApi = {
  async getRecords(params?: PaginationParams & { status?: ValidationStatus }): Promise<PaginatedResponse<DataRecord>> {
    if (USE_MOCK) {
      let data = mockData.records
      if (params?.status) {
        data = data.filter((record) => record.status === params.status)
      }
      const page = params?.page || 1
      const pageSize = params?.pageSize || 10
      return Promise.resolve({
        data,
        total: data.length,
        page,
        pageSize,
        totalPages: Math.ceil(data.length / pageSize),
      })
    }
    return apiClient.get<PaginatedResponse<DataRecord>>(`/validation/records${buildQuery(params)}`)
  },

  async updateRecord(id: string, data: Partial<DataRecord>): Promise<DataRecord> {
    if (USE_MOCK) {
      const record = mockData.records.find((item) => item.id === id)
      if (!record) throw new Error('Record not found')
      return Promise.resolve({ ...record, ...data, updatedAt: new Date().toISOString() })
    }
    return apiClient.put<DataRecord>(`/validation/records/${id}`, data)
  },

  async validateRecord(id: string, status: 'approved' | 'rejected'): Promise<DataRecord> {
    if (USE_MOCK) {
      const record = mockData.records.find((item) => item.id === id)
      if (!record) throw new Error('Record not found')
      return Promise.resolve({
        ...record,
        status,
        validatedAt: new Date().toISOString(),
        validatedBy: 'current-user',
        updatedAt: new Date().toISOString(),
      })
    }
    return apiClient.post<DataRecord>(`/validation/records/${id}/validate`, { status })
  },
}

export const userApi = {
  async getProfile(): Promise<UserProfile> {
    if (USE_MOCK) return Promise.resolve(mockData.userProfile)
    return apiClient.get<UserProfile>('/user/profile')
  },

  async getDashboardMetrics(): Promise<UserDashboardMetrics> {
    if (USE_MOCK) return Promise.resolve(mockData.userMetrics)
    return apiClient.get<UserDashboardMetrics>('/user/metrics')
  },

  async getNutritionSummary(): Promise<NutritionSummary> {
    if (USE_MOCK) return Promise.resolve(mockData.nutritionSummary)
    return apiClient.get<NutritionSummary>('/user/nutrition')
  },

  async getActivitySummary(): Promise<ActivitySummary> {
    if (USE_MOCK) return Promise.resolve(mockData.activitySummary)
    return apiClient.get<ActivitySummary>('/user/activity')
  },
}

export const exportApi = {
  async exportData(options: ExportOptions): Promise<Blob> {
    if (USE_MOCK) {
      const data =
        options.format === 'json'
          ? JSON.stringify(mockData.records, null, 2)
          : this.convertToCSV(mockData.records)
      return Promise.resolve(
        new Blob([data], { type: options.format === 'json' ? 'application/json' : 'text/csv' }),
      )
    }

    const response = await fetch(`${API_BASE_URL}/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    })

    if (!response.ok) {
      const payload = await parseErrorPayload(response)
      throw new ApiError(response.status, response.statusText, getStatusMessage(response.status), payload)
    }

    return response.blob()
  },

  convertToCSV(data: DataRecord[]): string {
    if (data.length === 0) return ''
    const headers = ['ID', 'Type', 'Status', 'Created At', 'Updated At']
    const rows = data.map((record) => [
      record.id,
      record.type,
      record.status,
      record.createdAt,
      record.updatedAt,
    ])
    return [headers, ...rows].map((row) => row.join(',')).join('\n')
  },
}
