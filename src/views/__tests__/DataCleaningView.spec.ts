import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import DataCleaningView from '../DataCleaningView.vue'
import { dataQualityApi } from '@/services/api'
import { useDataQualityStore } from '@/stores/dataQuality'
import type { DataAnomaly } from '@/types'

function mkAnomaly(overrides: Partial<DataAnomaly> = {}): DataAnomaly {
  return {
    id: 'a1',
    type: 'missing_value',
    entityType: 'nutrition',
    entityId: 'n1',
    field: 'protein_g',
    currentValue: null,
    suggestedValue: '20',
    detectedAt: '2026-05-01T12:00:00Z',
    severity: 'medium',
    status: 'pending',
    ...overrides,
  }
}

async function mountView() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/admin/data-cleaning', component: DataCleaningView }],
  })
  await router.push('/admin/data-cleaning')
  await router.isReady()

  return mount(DataCleaningView, {
    global: {
      plugins: [createPinia(), router],
      stubs: { FontAwesomeIcon: true, ConfirmDialog: true },
    },
  })
}

describe('DataCleaningView', () => {
  let getAnomaliesSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    setActivePinia(createPinia())
    getAnomaliesSpy = vi.spyOn(dataQualityApi, 'getAnomalies').mockResolvedValue({
      data: [
        mkAnomaly({ id: 'a1', field: 'protein_g', severity: 'high', type: 'missing_value' }),
        mkAnomaly({ id: 'a2', field: 'weight_kg', severity: 'low', type: 'outlier', currentValue: '200' }),
      ],
      total: 2,
      page: 1,
      pageSize: 10,
      totalPages: 1,
    })
    vi.spyOn(dataQualityApi, 'getMetrics').mockResolvedValue({
      totalRecords: 100,
      missingValues: 10,
      duplicates: 5,
      anomalies: 3,
      completenessRate: 95,
      dataFlowStatus: 'active',
      lastUpdate: '2026-05-01',
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('fetch les anomalies au montage', async () => {
    await mountView()
    await flushPromises()
    expect(getAnomaliesSpy).toHaveBeenCalled()
  })

  it('rend une ligne par anomalie', async () => {
    const wrapper = await mountView()
    await flushPromises()
    expect(wrapper.findAll('tbody tr')).toHaveLength(2)
    expect(wrapper.text()).toContain('protein_g')
    expect(wrapper.text()).toContain('weight_kg')
  })

  it('rend l empty-state si aucune anomalie', async () => {
    getAnomaliesSpy.mockResolvedValue({
      data: [], total: 0, page: 1, pageSize: 10, totalPages: 0,
    })
    const wrapper = await mountView()
    await flushPromises()
    expect(wrapper.find('.empty-state').exists()).toBe(true)
    expect(wrapper.text()).toMatch(/aucune anomalie/i)
  })

  it('filtre par sévérité', async () => {
    const wrapper = await mountView()
    await flushPromises()
    expect(wrapper.findAll('tbody tr')).toHaveLength(2)

    await wrapper.find('#severity-filter').setValue('high')
    await flushPromises()
    expect(wrapper.findAll('tbody tr')).toHaveLength(1)
    expect(wrapper.text()).toContain('protein_g')
  })

  it('filtre par type', async () => {
    const wrapper = await mountView()
    await flushPromises()
    await wrapper.find('#type-filter').setValue('outlier')
    await flushPromises()
    expect(wrapper.findAll('tbody tr')).toHaveLength(1)
    expect(wrapper.text()).toContain('weight_kg')
  })

  it('bouton Actualiser déclenche un fetchAnomalies', async () => {
    const wrapper = await mountView()
    await flushPromises()
    getAnomaliesSpy.mockClear()

    await wrapper.find('button.btn-primary').trigger('click')
    await flushPromises()
    expect(getAnomaliesSpy).toHaveBeenCalled()
  })

  it('startEdit affiche l input inline pour la suggestion', async () => {
    const wrapper = await mountView()
    await flushPromises()

    const editBtn = wrapper.find('.btn-icon--primary')
    await editBtn.trigger('click')
    expect(wrapper.find('input.input-inline').exists()).toBe(true)
  })

  it('cancelEdit retire l input inline', async () => {
    const wrapper = await mountView()
    await flushPromises()
    await wrapper.find('.btn-icon--primary').trigger('click')
    expect(wrapper.find('input.input-inline').exists()).toBe(true)

    await wrapper.find('.btn-icon--secondary').trigger('click')
    expect(wrapper.find('input.input-inline').exists()).toBe(false)
  })

  it('saveEdit appelle updateAnomaly avec la nouvelle valeur', async () => {
    const wrapper = await mountView()
    await flushPromises()
    const store = useDataQualityStore()
    const updateSpy = vi.spyOn(store, 'updateAnomaly').mockResolvedValue(undefined)

    await wrapper.find('.btn-icon--primary').trigger('click')
    await wrapper.find('input.input-inline').setValue('42')
    await wrapper.find('.btn-icon--success').trigger('click')
    await flushPromises()

    expect(updateSpy).toHaveBeenCalledWith('a1', { suggestedValue: '42' })
  })

  it('applyFix appelle updateAnomaly avec suggestedValue→currentValue + approved', async () => {
    const wrapper = await mountView()
    await flushPromises()
    const store = useDataQualityStore()
    const updateSpy = vi.spyOn(store, 'updateAnomaly').mockResolvedValue(undefined)

    const rows = wrapper.findAll('tbody tr')
    const applyBtn = rows[0]!.findAll('.btn-icon--success')[0]!
    await applyBtn.trigger('click')
    await flushPromises()

    expect(updateSpy).toHaveBeenCalledWith('a1', expect.objectContaining({
      status: 'approved',
      currentValue: '20',
    }))
  })

  it('deleteAnomaly ouvre la ConfirmDialog avec le bon champ', async () => {
    const wrapper = await mountView()
    await flushPromises()

    const rows = wrapper.findAll('tbody tr')
    const deleteBtn = rows[0]!.find('.btn-icon--danger')
    await deleteBtn.trigger('click')

    const dialog = wrapper.findComponent({ name: 'ConfirmDialog' })
    expect(dialog.props('open')).toBe(true)
    expect(dialog.props('message')).toContain('protein_g')
  })

  it('confirmDeleteAnomaly appelle deleteAnomaly du store', async () => {
    const wrapper = await mountView()
    await flushPromises()
    const store = useDataQualityStore()
    const deleteSpy = vi.spyOn(store, 'deleteAnomaly').mockResolvedValue(undefined)

    await wrapper.findAll('tbody tr')[0]!.find('.btn-icon--danger').trigger('click')
    const dialog = wrapper.findComponent({ name: 'ConfirmDialog' })
    await dialog.vm.$emit('confirm')
    await flushPromises()

    expect(deleteSpy).toHaveBeenCalledWith('a1')
  })

  it('export JSON déclenche un téléchargement', async () => {
    const createSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:x')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

    const wrapper = await mountView()
    await flushPromises()

    await wrapper.find('#export-format').setValue('json')
    await wrapper.find('.action-bar__right button.btn-secondary').trigger('click')
    await flushPromises()

    expect(createSpy).toHaveBeenCalled()
  })

  it('export CSV déclenche un téléchargement', async () => {
    const createSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:x')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

    const wrapper = await mountView()
    await flushPromises()

    await wrapper.find('#export-format').setValue('csv')
    await wrapper.find('.action-bar__right button.btn-secondary').trigger('click')
    await flushPromises()

    expect(createSpy).toHaveBeenCalled()
  })

  it('import JSON valide remplace les anomalies dans le store', async () => {
    const wrapper = await mountView()
    await flushPromises()
    const store = useDataQualityStore()

    const data = [
      {
        id: 'imp1', type: 'duplicate', entityType: 'user', entityId: 'u1',
        field: 'email', currentValue: 'a@b.c', suggestedValue: 'x@b.c',
        detectedAt: '2026-05-10T00:00:00Z', severity: 'low', status: 'pending',
      },
    ]
    const file = new File([JSON.stringify(data)], 'a.json', { type: 'application/json' })

    await wrapper.find('#import-format').setValue('json')
    const input = wrapper.find('input[type="file"]').element as HTMLInputElement
    Object.defineProperty(input, 'files', { value: [file], configurable: true })
    await wrapper.find('input[type="file"]').trigger('change')
    await flushPromises()

    expect(store.anomalies).toHaveLength(1)
    expect(store.anomalies[0]!.id).toBe('imp1')
  })

  it('import CSV valide remplace les anomalies', async () => {
    const wrapper = await mountView()
    await flushPromises()
    const store = useDataQualityStore()

    const csv = [
      'id,type,entityType,entityId,field,currentValue,suggestedValue,detectedAt,severity,status',
      'imp2,outlier,nutrition,n9,calories,3500,2200,2026-05-10T00:00:00Z,high,pending',
    ].join('\n')
    const file = new File([csv], 'a.csv', { type: 'text/csv' })

    await wrapper.find('#import-format').setValue('csv')
    const input = wrapper.find('input[type="file"]').element as HTMLInputElement
    Object.defineProperty(input, 'files', { value: [file], configurable: true })
    await wrapper.find('input[type="file"]').trigger('change')
    await flushPromises()

    expect(store.anomalies).toHaveLength(1)
    expect(store.anomalies[0]!.id).toBe('imp2')
    expect(store.anomalies[0]!.severity).toBe('high')
  })

  it('import fichier invalide montre une erreur', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const wrapper = await mountView()
    await flushPromises()

    const file = new File(['not-json{'], 'bad.json', { type: 'application/json' })
    await wrapper.find('#import-format').setValue('json')
    const input = wrapper.find('input[type="file"]').element as HTMLInputElement
    Object.defineProperty(input, 'files', { value: [file], configurable: true })
    await wrapper.find('input[type="file"]').trigger('change')
    await flushPromises()

    expect(wrapper.find('.alert-error').exists()).toBe(true)
    consoleSpy.mockRestore()
  })

  it('pagination: bouton Suivant désactivé si une seule page', async () => {
    const wrapper = await mountView()
    await flushPromises()
    expect(wrapper.find('.pagination').exists()).toBe(false)
  })

  it('pagination: navigue quand totalPages > 1', async () => {
    getAnomaliesSpy.mockResolvedValueOnce({
      data: [mkAnomaly({ id: 'p1' })],
      total: 25, page: 1, pageSize: 10, totalPages: 3,
    })
    const wrapper = await mountView()
    await flushPromises()

    expect(wrapper.find('.pagination').exists()).toBe(true)

    getAnomaliesSpy.mockResolvedValueOnce({
      data: [mkAnomaly({ id: 'p2' })],
      total: 25, page: 2, pageSize: 10, totalPages: 3,
    })
    const buttons = wrapper.findAll('.pagination__btn')
    await buttons[1]!.trigger('click')
    await flushPromises()

    expect(getAnomaliesSpy).toHaveBeenCalledTimes(2)
  })
})
