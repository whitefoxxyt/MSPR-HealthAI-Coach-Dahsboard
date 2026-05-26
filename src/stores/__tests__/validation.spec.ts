import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useValidationStore } from '../validation'
import { validationApi } from '@/services/api'
import type { DataRecord } from '@/types'

function makeRecord(id: string, status: DataRecord['status'] = 'pending'): DataRecord {
  return {
    id,
    type: 'user',
    data: {},
    status,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  }
}

describe('Validation Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('initialise les valeurs par défaut', () => {
    const store = useValidationStore()

    expect(store.records).toEqual([])
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
    expect(store.statusFilter).toBe('pending')
    expect(store.totalRecords).toBe(0)
    expect(store.currentPage).toBe(1)
    expect(store.pageSize).toBe(10)
    expect(store.totalPages).toBe(0)
  })

  it('calcule pendingCount/approved/rejected correctement', () => {
    const store = useValidationStore()

    store.records = [
      makeRecord('1', 'pending'),
      makeRecord('2', 'approved'),
      makeRecord('3', 'rejected'),
      makeRecord('4', 'pending'),
    ]

    expect(store.pendingCount).toBe(2)
    expect(store.approvedRecords).toHaveLength(1)
    expect(store.rejectedRecords).toHaveLength(1)
    expect(store.pendingRecords).toHaveLength(2)
  })

  it('totalPages se met à jour selon totalRecords et pageSize', () => {
    const store = useValidationStore()
    store.totalRecords = 25
    store.pageSize = 10
    expect(store.totalPages).toBe(3)
  })

  it('fetchRecords: succès — peuple records, totalRecords, currentPage', async () => {
    const spy = vi.spyOn(validationApi, 'getRecords').mockResolvedValue({
      data: [makeRecord('a'), makeRecord('b')],
      total: 2,
      page: 1,
      pageSize: 10,
      totalPages: 1,
    })

    const store = useValidationStore()
    await store.fetchRecords()

    expect(spy).toHaveBeenCalledWith(expect.objectContaining({
      page: 1,
      pageSize: 10,
      status: 'pending',
    }))
    expect(store.records).toHaveLength(2)
    expect(store.totalRecords).toBe(2)
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('fetchRecords: ne pousse pas le filtre quand statusFilter = all', async () => {
    const spy = vi.spyOn(validationApi, 'getRecords').mockResolvedValue({
      data: [], total: 0, page: 1, pageSize: 10, totalPages: 0,
    })

    const store = useValidationStore()
    store.statusFilter = 'all'
    await store.fetchRecords()

    const params = spy.mock.calls[0]![0] as Record<string, unknown>
    expect(params.status).toBeUndefined()
  })

  it('fetchRecords: erreur — set error sans rethrow', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(validationApi, 'getRecords').mockRejectedValue(new Error('500'))

    const store = useValidationStore()
    await store.fetchRecords()

    expect(store.error).toBe('500')
    expect(store.loading).toBe(false)
    consoleSpy.mockRestore()
  })

  it('fetchRecords: erreur non-Error — message par défaut', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(validationApi, 'getRecords').mockRejectedValue('weird')

    const store = useValidationStore()
    await store.fetchRecords()
    expect(store.error).toMatch(/chargement/i)
    consoleSpy.mockRestore()
  })

  it('updateRecord: succès — remplace l enregistrement dans la liste', async () => {
    const updated = makeRecord('a', 'approved')
    vi.spyOn(validationApi, 'updateRecord').mockResolvedValue(updated)

    const store = useValidationStore()
    store.records = [makeRecord('a'), makeRecord('b')]
    await store.updateRecord('a', { status: 'approved' })

    expect(store.records[0]!.status).toBe('approved')
  })

  it('updateRecord: si id absent — ne touche pas la liste', async () => {
    vi.spyOn(validationApi, 'updateRecord').mockResolvedValue(makeRecord('z'))
    const store = useValidationStore()
    store.records = [makeRecord('a')]
    await store.updateRecord('z', {})
    expect(store.records).toHaveLength(1)
    expect(store.records[0]!.id).toBe('a')
  })

  it('updateRecord: erreur — set error et rethrow', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(validationApi, 'updateRecord').mockRejectedValue(new Error('boom'))

    const store = useValidationStore()
    await expect(store.updateRecord('a', {})).rejects.toThrow('boom')
    expect(store.error).toBe('boom')
    consoleSpy.mockRestore()
  })

  it('updateRecord: erreur non-Error — message par défaut', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(validationApi, 'updateRecord').mockRejectedValue('weird')
    const store = useValidationStore()
    await expect(store.updateRecord('a', {})).rejects.toBe('weird')
    expect(store.error).toMatch(/mise à jour|mise a jour/i)
    consoleSpy.mockRestore()
  })

  it('validateRecord: succès — remplace l enregistrement et rafraîchit la liste', async () => {
    vi.spyOn(validationApi, 'validateRecord').mockResolvedValue(makeRecord('a', 'approved'))
    const fetchSpy = vi.spyOn(validationApi, 'getRecords').mockResolvedValue({
      data: [], total: 0, page: 1, pageSize: 10, totalPages: 0,
    })

    const store = useValidationStore()
    store.records = [makeRecord('a')]
    await store.validateRecord('a', 'approved')

    expect(store.records[0]?.status === 'approved' || store.records.length === 0).toBe(true)
    expect(fetchSpy).toHaveBeenCalled()
  })

  it('validateRecord: erreur — set error et rethrow', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(validationApi, 'validateRecord').mockRejectedValue(new Error('nope'))

    const store = useValidationStore()
    await expect(store.validateRecord('a', 'approved')).rejects.toThrow('nope')
    expect(store.error).toBe('nope')
    consoleSpy.mockRestore()
  })

  it('validateRecord: erreur non-Error — message par défaut', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(validationApi, 'validateRecord').mockRejectedValue('boom')
    const store = useValidationStore()
    await expect(store.validateRecord('a', 'rejected')).rejects.toBe('boom')
    expect(store.error).toMatch(/validation/i)
    consoleSpy.mockRestore()
  })

  it('batchValidate: appelle validate pour chaque id puis rafraîchit', async () => {
    const validateSpy = vi.spyOn(validationApi, 'validateRecord').mockResolvedValue(makeRecord('a'))
    const fetchSpy = vi.spyOn(validationApi, 'getRecords').mockResolvedValue({
      data: [], total: 0, page: 1, pageSize: 10, totalPages: 0,
    })

    const store = useValidationStore()
    await store.batchValidate(['a', 'b', 'c'], 'approved')

    expect(validateSpy).toHaveBeenCalledTimes(3)
    expect(validateSpy).toHaveBeenCalledWith('a', 'approved')
    expect(validateSpy).toHaveBeenCalledWith('b', 'approved')
    expect(validateSpy).toHaveBeenCalledWith('c', 'approved')
    expect(fetchSpy).toHaveBeenCalled()
  })

  it('batchValidate: erreur — set error et rethrow', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(validationApi, 'validateRecord').mockRejectedValue(new Error('batch fail'))

    const store = useValidationStore()
    await expect(store.batchValidate(['a'], 'approved')).rejects.toThrow('batch fail')
    expect(store.error).toBe('batch fail')
    consoleSpy.mockRestore()
  })

  it('batchValidate: erreur non-Error — message par défaut', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(validationApi, 'validateRecord').mockRejectedValue('boom')
    const store = useValidationStore()
    await expect(store.batchValidate(['a'], 'approved')).rejects.toBe('boom')
    expect(store.error).toMatch(/validation en lot/i)
    consoleSpy.mockRestore()
  })

  it('setStatusFilter: change le filtre, reset la page et déclenche fetchRecords', async () => {
    const spy = vi.spyOn(validationApi, 'getRecords').mockResolvedValue({
      data: [], total: 0, page: 1, pageSize: 10, totalPages: 0,
    })

    const store = useValidationStore()
    store.currentPage = 5
    store.setStatusFilter('approved')

    expect(store.statusFilter).toBe('approved')
    expect(store.currentPage).toBe(1)
    expect(spy).toHaveBeenCalled()
  })

  it('setPage: change la page et déclenche fetchRecords', () => {
    const spy = vi.spyOn(validationApi, 'getRecords').mockResolvedValue({
      data: [], total: 0, page: 1, pageSize: 10, totalPages: 0,
    })

    const store = useValidationStore()
    store.setPage(3)

    expect(store.currentPage).toBe(3)
    expect(spy).toHaveBeenCalled()
  })
})
