/**
 * Service API pour communiquer avec le backend
 * Utilise des données mockées en attendant l'intégration réelle
 */

import type {
  DataQualityMetrics,
  DataAnomaly,
  DataRecord,
  DataFlowStats,
  PaginatedResponse,
  PaginationParams,
  ExportOptions,
  ValidationStatus,
} from '@/types'

// Configuration de l'API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false' // Par défaut, on utilise le mock

/**
 * Classe utilitaire pour les appels API
 */
class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      // TODO: Ajouter l'authentification JWT ici
      // 'Authorization': `Bearer ${token}`
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  post<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  put<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
}

const apiClient = new ApiClient()

/**
 * Données mockées pour le développement
 */
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
}

/**
 * API Service - Métriques de qualité des données
 */
export const dataQualityApi = {
  async getMetrics(): Promise<DataQualityMetrics> {
    if (USE_MOCK) {
      return Promise.resolve(mockData.metrics)
    }
    return apiClient.get<DataQualityMetrics>('/data-quality/metrics')
  },

  async getAnomalies(params?: PaginationParams): Promise<PaginatedResponse<DataAnomaly>> {
    if (USE_MOCK) {
      const data = mockData.anomalies
      return Promise.resolve({
        data,
        total: data.length,
        page: params?.page || 1,
        pageSize: params?.pageSize || 10,
        totalPages: Math.ceil(data.length / (params?.pageSize || 10)),
      })
    }
    const query = new URLSearchParams(params as unknown as Record<string, string>).toString()
    return apiClient.get<PaginatedResponse<DataAnomaly>>(`/data-quality/anomalies?${query}`)
  },

  async getDataFlowStats(): Promise<DataFlowStats[]> {
    if (USE_MOCK) {
      return Promise.resolve(mockData.dataFlows)
    }
    return apiClient.get<DataFlowStats[]>('/data-quality/flows')
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

/**
 * API Service - Validation workflow
 */
export const validationApi = {
  async getRecords(params?: PaginationParams & { status?: ValidationStatus }): Promise<PaginatedResponse<DataRecord>> {
    if (USE_MOCK) {
      let data = mockData.records
      if (params?.status) {
        data = data.filter((r) => r.status === params.status)
      }
      return Promise.resolve({
        data,
        total: data.length,
        page: params?.page || 1,
        pageSize: params?.pageSize || 10,
        totalPages: Math.ceil(data.length / (params?.pageSize || 10)),
      })
    }
    const query = new URLSearchParams(params as unknown as Record<string, string>).toString()
    return apiClient.get<PaginatedResponse<DataRecord>>(`/validation/records?${query}`)
  },

  async updateRecord(id: string, data: Partial<DataRecord>): Promise<DataRecord> {
    if (USE_MOCK) {
      const record = mockData.records.find((r) => r.id === id)
      if (!record) throw new Error('Record not found')
      return Promise.resolve({ ...record, ...data, updatedAt: new Date().toISOString() })
    }
    return apiClient.put<DataRecord>(`/validation/records/${id}`, data)
  },

  async validateRecord(id: string, status: 'approved' | 'rejected'): Promise<DataRecord> {
    if (USE_MOCK) {
      const record = mockData.records.find((r) => r.id === id)
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

/**
 * API Service - Export de données
 */
export const exportApi = {
  async exportData(options: ExportOptions): Promise<Blob> {
    if (USE_MOCK) {
      // Simulation d'export
      const data = options.format === 'json' 
        ? JSON.stringify(mockData.records, null, 2)
        : this.convertToCSV(mockData.records)
      
      return Promise.resolve(new Blob([data], { 
        type: options.format === 'json' ? 'application/json' : 'text/csv' 
      }))
    }
    
    const response = await fetch(`${API_BASE_URL}/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    })
    
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
