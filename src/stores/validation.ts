/**
 * Store Pinia pour la gestion du workflow de validation
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { DataRecord, ValidationStatus, PaginationParams } from '@/types'
import { validationApi } from '@/services/api'

export const useValidationStore = defineStore('validation', () => {
  // État
  const records = ref<DataRecord[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const totalRecords = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(10)
  const statusFilter = ref<ValidationStatus | 'all'>('pending')

  // Getters
  const pendingRecords = computed(() =>
    records.value.filter((r) => r.status === 'pending')
  )

  const approvedRecords = computed(() =>
    records.value.filter((r) => r.status === 'approved')
  )

  const rejectedRecords = computed(() =>
    records.value.filter((r) => r.status === 'rejected')
  )

  const pendingCount = computed(() => pendingRecords.value.length)

  const totalPages = computed(() => Math.ceil(totalRecords.value / pageSize.value))

  // Actions
  async function fetchRecords(params?: PaginationParams & { status?: ValidationStatus }) {
    loading.value = true
    error.value = null
    try {
      const filterParams = {
        page: currentPage.value,
        pageSize: pageSize.value,
        ...(statusFilter.value !== 'all' && { status: statusFilter.value as ValidationStatus }),
        ...params,
      }
      
      const response = await validationApi.getRecords(filterParams)
      records.value = response.data
      totalRecords.value = response.total
      currentPage.value = response.page
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Erreur lors du chargement des enregistrements'
      console.error('Error fetching records:', e)
    } finally {
      loading.value = false
    }
  }

  async function updateRecord(id: string, data: Partial<DataRecord>) {
    loading.value = true
    error.value = null
    try {
      const updated = await validationApi.updateRecord(id, data)
      const index = records.value.findIndex((r) => r.id === id)
      if (index !== -1) {
        records.value[index] = updated
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Erreur lors de la mise à jour'
      console.error('Error updating record:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function validateRecord(id: string, status: 'approved' | 'rejected') {
    loading.value = true
    error.value = null
    try {
      const validated = await validationApi.validateRecord(id, status)
      const index = records.value.findIndex((r) => r.id === id)
      if (index !== -1) {
        records.value[index] = validated
      }
      // Rafraîchir la liste après validation
      await fetchRecords()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Erreur lors de la validation'
      console.error('Error validating record:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function batchValidate(ids: string[], status: 'approved' | 'rejected') {
    loading.value = true
    error.value = null
    try {
      // Validation en parallèle
      await Promise.all(ids.map((id) => validationApi.validateRecord(id, status)))
      // Rafraîchir la liste après validation
      await fetchRecords()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Erreur lors de la validation en lot'
      console.error('Error batch validating:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  function setStatusFilter(status: ValidationStatus | 'all') {
    statusFilter.value = status
    currentPage.value = 1
    fetchRecords()
  }

  function setPage(page: number) {
    currentPage.value = page
    fetchRecords()
  }

  return {
    // État
    records,
    loading,
    error,
    totalRecords,
    currentPage,
    pageSize,
    statusFilter,
    // Getters
    pendingRecords,
    approvedRecords,
    rejectedRecords,
    pendingCount,
    totalPages,
    // Actions
    fetchRecords,
    updateRecord,
    validateRecord,
    batchValidate,
    setStatusFilter,
    setPage,
  }
})
