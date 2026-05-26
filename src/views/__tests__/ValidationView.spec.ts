import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import ValidationView from '../ValidationView.vue'
import { validationApi } from '@/services/api'
import { useValidationStore } from '@/stores/validation'
import type { DataRecord } from '@/types'

function mkRecord(overrides: Partial<DataRecord> = {}): DataRecord {
  return {
    id: 'r1',
    type: 'nutrition',
    data: { protein_g: 25 },
    status: 'pending',
    createdAt: '2026-05-01T10:00:00Z',
    updatedAt: '2026-05-01T10:30:00Z',
    ...overrides,
  }
}

async function mountView() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/admin/validation', component: ValidationView }],
  })
  await router.push('/admin/validation')
  await router.isReady()
  return mount(ValidationView, {
    global: {
      plugins: [createPinia(), router],
      stubs: { FontAwesomeIcon: true, ConfirmDialog: true, BaseModal: true },
    },
  })
}

describe('ValidationView', () => {
  let getRecordsSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    setActivePinia(createPinia())
    getRecordsSpy = vi.spyOn(validationApi, 'getRecords').mockResolvedValue({
      data: [
        mkRecord({ id: 'r1', status: 'pending', type: 'nutrition' }),
        mkRecord({ id: 'r2', status: 'pending', type: 'exercise' }),
      ],
      total: 2,
      page: 1,
      pageSize: 10,
      totalPages: 1,
    })
    vi.stubGlobal('scrollTo', vi.fn())
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('fetch les records au montage', async () => {
    await mountView()
    await flushPromises()
    expect(getRecordsSpy).toHaveBeenCalled()
  })

  it('affiche le titre et le sous-titre', async () => {
    const wrapper = await mountView()
    await flushPromises()
    expect(wrapper.text()).toMatch(/workflow de validation/i)
    expect(wrapper.text()).toMatch(/approuvez ou rejetez/i)
  })

  it('rend une record-card par enregistrement', async () => {
    const wrapper = await mountView()
    await flushPromises()
    expect(wrapper.findAll('.record-card')).toHaveLength(2)
  })

  it('rend l empty state si aucun record', async () => {
    getRecordsSpy.mockResolvedValue({
      data: [], total: 0, page: 1, pageSize: 10, totalPages: 0,
    })
    const wrapper = await mountView()
    await flushPromises()
    expect(wrapper.find('.empty-state').exists()).toBe(true)
  })

  it('clic sur un onglet de filtre change le filtre', async () => {
    const wrapper = await mountView()
    await flushPromises()
    const store = useValidationStore()
    const setStatusFilterSpy = vi.spyOn(store, 'setStatusFilter')

    const tabs = wrapper.findAll('.filter-tab')
    await tabs[2]!.trigger('click') // Approuvés
    expect(setStatusFilterSpy).toHaveBeenCalledWith('approved')
  })

  it('Actualiser appelle fetchRecords du store', async () => {
    const wrapper = await mountView()
    await flushPromises()
    getRecordsSpy.mockClear()

    await wrapper.find('button.btn-primary').trigger('click')
    await flushPromises()
    expect(getRecordsSpy).toHaveBeenCalled()
  })

  it('toggleSelection ajoute / retire un id', async () => {
    const wrapper = await mountView()
    await flushPromises()

    const checkbox = wrapper.find('input.record-checkbox')
    await checkbox.setValue(true)
    expect(wrapper.text()).toMatch(/1 sélectionné|1 selectionne/i)

    await checkbox.setValue(false)
    expect(wrapper.text()).not.toMatch(/1 sélectionné/i)
  })

  it('batchApprove ouvre la dialog avec action=approved', async () => {
    const wrapper = await mountView()
    await flushPromises()

    const checkboxes = wrapper.findAll('input.record-checkbox')
    await checkboxes[0]!.setValue(true)
    await checkboxes[1]!.setValue(true)

    const buttons = wrapper.findAll('.action-bar__right button')
    const approveBtn = buttons.find((b) => b.classes().includes('btn-success'))!
    await approveBtn.trigger('click')

    const dialog = wrapper.findComponent({ name: 'ConfirmDialog' })
    expect(dialog.props('open')).toBe(true)
    expect(dialog.props('title')).toMatch(/approuver/i)
  })

  it('batchReject ouvre la dialog avec action=rejected', async () => {
    const wrapper = await mountView()
    await flushPromises()

    await wrapper.find('input.record-checkbox').setValue(true)
    const buttons = wrapper.findAll('.action-bar__right button')
    const rejectBtn = buttons.find((b) => b.classes().includes('btn-danger'))!
    await rejectBtn.trigger('click')

    const dialog = wrapper.findComponent({ name: 'ConfirmDialog' })
    expect(dialog.props('open')).toBe(true)
    expect(dialog.props('title')).toMatch(/rejeter/i)
  })

  it('confirmBatch appelle batchValidate du store', async () => {
    const wrapper = await mountView()
    await flushPromises()
    const store = useValidationStore()
    const batchSpy = vi.spyOn(store, 'batchValidate').mockResolvedValue(undefined)

    await wrapper.find('input.record-checkbox').setValue(true)
    const buttons = wrapper.findAll('.action-bar__right button')
    const approveBtn = buttons.find((b) => b.classes().includes('btn-success'))!
    await approveBtn.trigger('click')

    const dialog = wrapper.findComponent({ name: 'ConfirmDialog' })
    await dialog.vm.$emit('confirm')
    await flushPromises()

    expect(batchSpy).toHaveBeenCalledWith(['r1'], 'approved')
  })

  it('validateRecord (approve unique) appelle validationStore.validateRecord', async () => {
    const wrapper = await mountView()
    await flushPromises()
    const store = useValidationStore()
    const spy = vi.spyOn(store, 'validateRecord').mockResolvedValue(undefined)

    const card = wrapper.findAll('.record-card')[0]!
    const buttons = card.findAll('.record-card__footer button')
    const approveBtn = buttons.find((b) => b.classes().includes('btn-success'))!
    await approveBtn.trigger('click')
    await flushPromises()

    expect(spy).toHaveBeenCalledWith('r1', 'approved')
  })

  it('validateRecord (reject unique) appelle validationStore.validateRecord', async () => {
    const wrapper = await mountView()
    await flushPromises()
    const store = useValidationStore()
    const spy = vi.spyOn(store, 'validateRecord').mockResolvedValue(undefined)

    const card = wrapper.findAll('.record-card')[0]!
    const buttons = card.findAll('.record-card__footer button')
    const rejectBtn = buttons.find((b) => b.classes().includes('btn-danger'))!
    await rejectBtn.trigger('click')
    await flushPromises()

    expect(spy).toHaveBeenCalledWith('r1', 'rejected')
  })

  it('startEdit affiche le textarea avec les données JSON', async () => {
    const wrapper = await mountView()
    await flushPromises()

    const card = wrapper.findAll('.record-card')[0]!
    const editBtn = card.findAll('button').find((b) => b.text().includes('Éditer'))!
    await editBtn.trigger('click')

    const textarea = card.find('textarea.data-textarea')
    expect(textarea.exists()).toBe(true)
    expect(textarea.element.value).toContain('protein_g')
  })

  it('saveEdit avec JSON valide appelle updateRecord', async () => {
    const wrapper = await mountView()
    await flushPromises()
    const store = useValidationStore()
    const updateSpy = vi.spyOn(store, 'updateRecord').mockResolvedValue(undefined)

    const card = wrapper.findAll('.record-card')[0]!
    const editBtn = card.findAll('button').find((b) => b.text().includes('Éditer'))!
    await editBtn.trigger('click')
    await card.find('textarea').setValue('{"new_field": 42}')
    const saveBtn = card.findAll('button').find((b) => b.text().includes('Enregistrer'))!
    await saveBtn.trigger('click')
    await flushPromises()

    expect(updateSpy).toHaveBeenCalledWith('r1', { data: { new_field: 42 } })
  })

  it('saveEdit avec JSON invalide affiche une erreur', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const wrapper = await mountView()
    await flushPromises()

    const card = wrapper.findAll('.record-card')[0]!
    const editBtn = card.findAll('button').find((b) => b.text().includes('Éditer'))!
    await editBtn.trigger('click')
    await card.find('textarea').setValue('not json {')
    const saveBtn = card.findAll('button').find((b) => b.text().includes('Enregistrer'))!
    await saveBtn.trigger('click')
    await flushPromises()

    expect(wrapper.find('.alert-error').text()).toMatch(/json invalide/i)
    consoleSpy.mockRestore()
  })

  it('cancelEdit retire le textarea', async () => {
    const wrapper = await mountView()
    await flushPromises()

    const card = wrapper.findAll('.record-card')[0]!
    const editBtn = card.findAll('button').find((b) => b.text().includes('Éditer'))!
    await editBtn.trigger('click')
    expect(card.find('textarea').exists()).toBe(true)

    const cancelBtn = card.findAll('button').find((b) => b.text().includes('Annuler'))!
    await cancelBtn.trigger('click')
    expect(card.find('textarea').exists()).toBe(false)
  })

  it('viewDetails ouvre la BaseModal pour un record déjà validé', async () => {
    getRecordsSpy.mockResolvedValue({
      data: [mkRecord({ id: 'r1', status: 'approved' })],
      total: 1, page: 1, pageSize: 10, totalPages: 1,
    })
    const wrapper = await mountView()
    await flushPromises()

    const card = wrapper.findAll('.record-card')[0]!
    const detailsBtn = card.findAll('button').find((b) => b.text().includes('Voir détails'))!
    await detailsBtn.trigger('click')

    const modal = wrapper.findComponent({ name: 'BaseModal' })
    expect(modal.props('open')).toBe(true)
  })

  it('goToPage déclenche setPage du store + scroll', async () => {
    getRecordsSpy.mockResolvedValueOnce({
      data: [mkRecord({ id: 'p1' })],
      total: 25, page: 1, pageSize: 10, totalPages: 3,
    })
    const wrapper = await mountView()
    await flushPromises()
    const store = useValidationStore()
    const setPageSpy = vi.spyOn(store, 'setPage')

    getRecordsSpy.mockResolvedValueOnce({
      data: [mkRecord({ id: 'p2' })],
      total: 25, page: 2, pageSize: 10, totalPages: 3,
    })

    const nextBtn = wrapper.findAll('.pagination__btn').at(-1)!
    await nextBtn.trigger('click')
    await flushPromises()

    expect(setPageSpy).toHaveBeenCalledWith(2)
  })

  it('records validés affichent leur badge + pas de boutons de validation', async () => {
    getRecordsSpy.mockResolvedValue({
      data: [mkRecord({ id: 'r1', status: 'approved', validatedBy: 'arthur' })],
      total: 1, page: 1, pageSize: 10, totalPages: 1,
    })
    const wrapper = await mountView()
    await flushPromises()

    const card = wrapper.findAll('.record-card')[0]!
    expect(card.find('.record-status--approved').exists()).toBe(true)
    expect(card.find('input.record-checkbox').exists()).toBe(false)
  })
})
