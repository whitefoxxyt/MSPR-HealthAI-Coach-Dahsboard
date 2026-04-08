import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useDataQualityStore } from '../dataQuality'

describe('DataQuality Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should initialize with default values', () => {
    const store = useDataQualityStore()
    
    expect(store.metrics).toBeNull()
    expect(store.anomalies).toEqual([])
    expect(store.dataFlows).toEqual([])
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('should compute healthScore correctly', () => {
    const store = useDataQualityStore()
    
    store.metrics = {
      totalRecords: 1000,
      missingValues: 50,
      duplicates: 10,
      anomalies: 5,
      completenessRate: 95.5,
      dataFlowStatus: 'active',
      lastUpdate: new Date().toISOString(),
    }
    
    expect(store.healthScore).toBe(96)
  })
})
