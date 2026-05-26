import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { dataQualityApi, dietRecommendationApi, validationApi, exportApi } from '../api'
import { authSessionManager } from '../auth'

const API_BASE_URL = 'http://localhost:8080/api'

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('services/api', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    localStorage.clear()
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({}))
  })

  afterEach(() => {
    fetchSpy.mockRestore()
    localStorage.clear()
  })

  function seedSession() {
    authSessionManager.setSession({
      user: { id: 'u', username: 'u', email: 'u@a.b', role: 'admin' },
      tokens: { accessToken: 'tok', refreshToken: 'r', expiresAt: '2099-01-01T00:00:00.000Z' },
    })
  }

  describe('dataQualityApi', () => {
    it('getMetrics: GET /data-quality/metrics avec Authorization si session', async () => {
      seedSession()
      fetchSpy.mockResolvedValue(jsonResponse({ totalRecords: 10 }))

      const res = await dataQualityApi.getMetrics()

      expect(res).toEqual({ totalRecords: 10 })
      const [url, init] = fetchSpy.mock.calls[0]!
      expect(url).toBe(`${API_BASE_URL}/data-quality/metrics`)
      expect((init as RequestInit).method).toBe('GET')
      const headers = (init as RequestInit).headers as Record<string, string>
      expect(headers.Authorization).toBe('Bearer tok')
      expect(headers['Content-Type']).toBe('application/json')
    })

    it('getMetrics: pas d Authorization si pas de session', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({}))
      await dataQualityApi.getMetrics()
      const headers = (fetchSpy.mock.calls[0]![1] as RequestInit).headers as Record<string, string>
      expect(headers.Authorization).toBeUndefined()
    })

    it('getAnomalies: encode les paramètres en query string', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({ data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 }))
      await dataQualityApi.getAnomalies({ page: 2, pageSize: 5 })
      const url = String(fetchSpy.mock.calls[0]![0])
      expect(url).toContain(`${API_BASE_URL}/data-quality/anomalies?`)
      expect(url).toContain('page=2')
      expect(url).toContain('pageSize=5')
    })

    it('getAnomalies: sans paramètres, URL sans query', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({ data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 }))
      await dataQualityApi.getAnomalies()
      const url = String(fetchSpy.mock.calls[0]![0])
      expect(url).toBe(`${API_BASE_URL}/data-quality/anomalies`)
    })

    it('getDataFlowStats: GET /data-quality/flows', async () => {
      fetchSpy.mockResolvedValue(jsonResponse([]))
      await dataQualityApi.getDataFlowStats()
      expect(String(fetchSpy.mock.calls[0]![0])).toBe(`${API_BASE_URL}/data-quality/flows`)
    })

    it('getAnalyticsOverview: GET /analytics/overview', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({}))
      await dataQualityApi.getAnalyticsOverview()
      expect(String(fetchSpy.mock.calls[0]![0])).toBe(`${API_BASE_URL}/analytics/overview`)
    })

    it('updateAnomaly: PUT avec body sérialisé', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({ id: '1' }))
      await dataQualityApi.updateAnomaly('1', { status: 'approved' })
      const [url, init] = fetchSpy.mock.calls[0]!
      expect(url).toBe(`${API_BASE_URL}/data-quality/anomalies/1`)
      expect((init as RequestInit).method).toBe('PUT')
      expect(JSON.parse((init as RequestInit).body as string)).toEqual({ status: 'approved' })
    })

    it('deleteAnomaly: DELETE sur /data-quality/anomalies/:id', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({}))
      await dataQualityApi.deleteAnomaly('42')
      const [url, init] = fetchSpy.mock.calls[0]!
      expect(url).toBe(`${API_BASE_URL}/data-quality/anomalies/42`)
      expect((init as RequestInit).method).toBe('DELETE')
    })

    it('getEtlReport: GET /data-quality/etl-report', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({}))
      await dataQualityApi.getEtlReport()
      expect(String(fetchSpy.mock.calls[0]![0])).toBe(`${API_BASE_URL}/data-quality/etl-report`)
    })

    it('rejette avec un message d erreur lisible si !ok', async () => {
      fetchSpy.mockResolvedValue(new Response('Internal Server Error', { status: 500, statusText: 'Internal Server Error' }))
      await expect(dataQualityApi.getMetrics()).rejects.toThrow(/api error: 500/i)
    })
  })

  describe('dietRecommendationApi', () => {
    it('getStats: GET /diet-recommendations/stats', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({ totalCount: 0 }))
      await dietRecommendationApi.getStats()
      expect(String(fetchSpy.mock.calls[0]![0])).toBe(`${API_BASE_URL}/diet-recommendations/stats`)
    })

    it('getList: GET avec page et pageSize par défaut', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({ data: [], total: 0, page: 1, pageSize: 20, totalPages: 0 }))
      await dietRecommendationApi.getList()
      expect(String(fetchSpy.mock.calls[0]![0])).toBe(`${API_BASE_URL}/diet-recommendations?page=1&pageSize=20`)
    })

    it('getList: GET avec page et pageSize personnalisés', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({ data: [], total: 0, page: 3, pageSize: 5, totalPages: 0 }))
      await dietRecommendationApi.getList(3, 5)
      expect(String(fetchSpy.mock.calls[0]![0])).toBe(`${API_BASE_URL}/diet-recommendations?page=3&pageSize=5`)
    })

    it('getById: GET /diet-recommendations/:id', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({}))
      await dietRecommendationApi.getById(99)
      expect(String(fetchSpy.mock.calls[0]![0])).toBe(`${API_BASE_URL}/diet-recommendations/99`)
    })
  })

  describe('validationApi', () => {
    it('getRecords: encode tous les paramètres', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({ data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 }))
      await validationApi.getRecords({ page: 1, pageSize: 10, status: 'pending' })
      const url = String(fetchSpy.mock.calls[0]![0])
      expect(url).toContain('page=1')
      expect(url).toContain('pageSize=10')
      expect(url).toContain('status=pending')
    })

    it('getRecords: sans paramètres', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({ data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 }))
      await validationApi.getRecords()
      expect(String(fetchSpy.mock.calls[0]![0])).toBe(`${API_BASE_URL}/validation/records`)
    })

    it('updateRecord: PUT avec body sérialisé', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({}))
      await validationApi.updateRecord('r1', { status: 'approved' })
      const [url, init] = fetchSpy.mock.calls[0]!
      expect(url).toBe(`${API_BASE_URL}/validation/records/r1`)
      expect((init as RequestInit).method).toBe('PUT')
      expect(JSON.parse((init as RequestInit).body as string)).toEqual({ status: 'approved' })
    })

    it('validateRecord: POST /validation/records/:id/validate', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({}))
      await validationApi.validateRecord('r1', 'rejected')
      const [url, init] = fetchSpy.mock.calls[0]!
      expect(url).toBe(`${API_BASE_URL}/validation/records/r1/validate`)
      expect((init as RequestInit).method).toBe('POST')
      expect(JSON.parse((init as RequestInit).body as string)).toEqual({ status: 'rejected' })
    })
  })

  describe('exportApi', () => {
    it('exportData: POST /export avec options sérialisées et Authorization', async () => {
      seedSession()
      const blob = new Blob(['hello'], { type: 'text/plain' })
      fetchSpy.mockResolvedValue({ ok: true, status: 200, blob: () => Promise.resolve(blob) } as unknown as Response)

      const result = await exportApi.exportData({
        format: 'csv',
        includeMetadata: true,
        entityTypes: ['user', 'nutrition'],
      })

      expect(result).toBeInstanceOf(Blob)
      const [url, init] = fetchSpy.mock.calls[0]!
      expect(url).toBe(`${API_BASE_URL}/export`)
      expect((init as RequestInit).method).toBe('POST')
      const headers = (init as RequestInit).headers as Record<string, string>
      expect(headers.Authorization).toBe('Bearer tok')
      const body = JSON.parse((init as RequestInit).body as string)
      expect(body.format).toBe('csv')
      expect(body.entityTypes).toEqual(['user', 'nutrition'])
    })

    it('exportData: sans Authorization si pas de session', async () => {
      fetchSpy.mockResolvedValue({ ok: true, status: 200, blob: () => Promise.resolve(new Blob()) } as unknown as Response)
      await exportApi.exportData({ format: 'json', includeMetadata: false })
      const headers = (fetchSpy.mock.calls[0]![1] as RequestInit).headers as Record<string, string>
      expect(headers.Authorization).toBeUndefined()
    })

    it('exportData: lève une erreur si !ok', async () => {
      fetchSpy.mockResolvedValue(new Response('boom', { status: 500, statusText: 'Internal Server Error' }))
      await expect(exportApi.exportData({ format: 'json', includeMetadata: false })).rejects.toThrow(/export error: 500/i)
    })

    it('convertToCSV: chaîne vide pour une liste vide', () => {
      expect(exportApi.convertToCSV([])).toBe('')
    })

    it('convertToCSV: en-têtes + lignes', () => {
      const csv = exportApi.convertToCSV([
        { id: '1', type: 'user', data: {}, status: 'pending', createdAt: 'c1', updatedAt: 'u1' },
        { id: '2', type: 'nutrition', data: {}, status: 'approved', createdAt: 'c2', updatedAt: 'u2' },
      ])
      const lines = csv.split('\n')
      expect(lines[0]).toContain('ID,Type,Status,Created At,Updated At')
      expect(lines[1]).toContain('1,user,pending,c1,u1')
      expect(lines[2]).toContain('2,nutrition,approved,c2,u2')
    })
  })
})
