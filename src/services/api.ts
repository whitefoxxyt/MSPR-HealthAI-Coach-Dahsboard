import type {
  DataQualityMetrics,
  DataAnomaly,
  DataRecord,
  DataFlowStats,
  PaginatedResponse,
  PaginationParams,
  ExportOptions,
  ValidationStatus,
  AnalyticsOverview,
  DietRecommendationStats,
  DietRecommendationItem,
  EtlReport,
} from '@/types'
import { authSessionManager } from '@/services/auth'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'

class ApiClient {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    const accessToken = authSessionManager.getAccessToken()

    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...(options.headers as Record<string, string>),
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

export const dataQualityApi = {
  getMetrics(): Promise<DataQualityMetrics> {
    return apiClient.get<DataQualityMetrics>('/data-quality/metrics')
  },

  getAnomalies(params?: PaginationParams): Promise<PaginatedResponse<DataAnomaly>> {
    const query = params
      ? '?' + new URLSearchParams(params as unknown as Record<string, string>).toString()
      : ''
    return apiClient.get<PaginatedResponse<DataAnomaly>>(`/data-quality/anomalies${query}`)
  },

  getDataFlowStats(): Promise<DataFlowStats[]> {
    return apiClient.get<DataFlowStats[]>('/data-quality/flows')
  },

  getAnalyticsOverview(): Promise<AnalyticsOverview> {
    return apiClient.get<AnalyticsOverview>('/analytics/overview')
  },

  updateAnomaly(id: string, data: Partial<DataAnomaly>): Promise<DataAnomaly> {
    return apiClient.put<DataAnomaly>(`/data-quality/anomalies/${id}`, data)
  },

  deleteAnomaly(id: string): Promise<void> {
    return apiClient.delete<void>(`/data-quality/anomalies/${id}`)
  },

  getEtlReport(): Promise<EtlReport> {
    return apiClient.get<EtlReport>('/data-quality/etl-report')
  },
}

export const dietRecommendationApi = {
  getStats(): Promise<DietRecommendationStats> {
    return apiClient.get<DietRecommendationStats>('/diet-recommendations/stats')
  },

  getList(page = 1, pageSize = 20): Promise<PaginatedResponse<DietRecommendationItem>> {
    return apiClient.get<PaginatedResponse<DietRecommendationItem>>(
      `/diet-recommendations?page=${page}&pageSize=${pageSize}`
    )
  },

  getById(id: number): Promise<DietRecommendationItem> {
    return apiClient.get<DietRecommendationItem>(`/diet-recommendations/${id}`)
  },
}

export const validationApi = {
  getRecords(params?: PaginationParams & { status?: ValidationStatus }): Promise<PaginatedResponse<DataRecord>> {
    const query = params
      ? '?' + new URLSearchParams(params as unknown as Record<string, string>).toString()
      : ''
    return apiClient.get<PaginatedResponse<DataRecord>>(`/validation/records${query}`)
  },

  updateRecord(id: string, data: Partial<DataRecord>): Promise<DataRecord> {
    return apiClient.put<DataRecord>(`/validation/records/${id}`, data)
  },

  validateRecord(id: string, status: 'approved' | 'rejected'): Promise<DataRecord> {
    return apiClient.post<DataRecord>(`/validation/records/${id}/validate`, { status })
  },
}

export const exportApi = {
  async exportData(options: ExportOptions): Promise<Blob> {
    const accessToken = authSessionManager.getAccessToken()
    const response = await fetch(`${API_BASE_URL}/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify(options),
    })
    if (!response.ok) {
      throw new Error(`Export error: ${response.status} ${response.statusText}`)
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
