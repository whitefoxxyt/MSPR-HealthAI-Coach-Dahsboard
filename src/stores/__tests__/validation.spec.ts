import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useValidationStore } from '../validation'

describe('Validation Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should initialize with default values', () => {
    const store = useValidationStore()
    
    expect(store.records).toEqual([])
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
    expect(store.statusFilter).toBe('pending')
  })

  it('should compute pendingCount correctly', () => {
    const store = useValidationStore()
    
    store.records = [
      {
        id: '1',
        type: 'user',
        data: {},
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        type: 'user',
        data: {},
        status: 'approved',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]
    
    expect(store.pendingCount).toBe(1)
  })
})
