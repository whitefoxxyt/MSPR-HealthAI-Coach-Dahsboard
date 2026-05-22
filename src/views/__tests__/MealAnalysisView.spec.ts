import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import MealAnalysisView from '../MealAnalysisView.vue'

const AUTH_STORAGE_KEY = 'healthai.auth.session'

function jsonResponse(payload: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  })
}

function seedAuthSession() {
  localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({
      user: { id: 'user-1', username: 'arthur', email: 'arthur@healthai.test', role: 'user' },
      tokens: {
        accessToken: 'jwt-test-token',
        refreshToken: 'refresh-token',
        expiresAt: '2099-01-01T00:00:00.000Z',
      },
    }),
  )
}

function imageFile(name = 'meal.png', sizeBytes = 1024, type = 'image/png'): File {
  return new File([new Uint8Array(sizeBytes)], name, { type })
}

const ANALYSIS_PAYLOAD = {
  detected_foods: [
    { name: 'Pizza margherita', confidence: 0.92 },
    { name: 'Salade verte', confidence: 0.68 },
  ],
  macros: {
    calories: 720,
    protein_g: 28,
    carbs_g: 82,
    fat_g: 30,
    fiber_g: 6,
  },
  insight: 'Pense à ajouter une portion de légumes verts pour booster les fibres.',
  llm_backend_used: 'mistral',
}

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/meal-analysis', component: MealAnalysisView },
      { path: '/', component: { template: '<div />' } },
    ],
  })
}

async function mountView() {
  const router = createTestRouter()
  await router.push('/meal-analysis')
  await router.isReady()
  return mount(MealAnalysisView, {
    global: { plugins: [createPinia(), router] },
    attachTo: document.body,
  })
}

describe('MealAnalysisView', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    setActivePinia(createPinia())
    seedAuthSession()
    fetchSpy = vi.spyOn(globalThis, 'fetch')
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake-url')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.removeItem(AUTH_STORAGE_KEY)
  })

  async function pickFile(wrapper: ReturnType<typeof mount>, file: File) {
    const input = wrapper.find('input[type="file"]').element as HTMLInputElement
    Object.defineProperty(input, 'files', { value: [file], configurable: true })
    await wrapper.find('input[type="file"]').trigger('change')
  }

  it('renders the dropzone in the initial state', async () => {
    const wrapper = await mountView()

    expect(wrapper.find('[data-testid="dropzone"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="analyze-button"]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('exposes a meal_type selector with the 4 standard options', async () => {
    const wrapper = await mountView()

    const select = wrapper.find('[data-testid="meal-type-select"] select')
    expect(select.exists()).toBe(true)
    const html = select.element.innerHTML
    expect(html).toContain('breakfast')
    expect(html).toContain('lunch')
    expect(html).toContain('dinner')
    expect(html).toContain('snack')
    wrapper.unmount()
  })

  it('enables the "Analyser" button once a file is selected', async () => {
    const wrapper = await mountView()

    let btn = wrapper.find('[data-testid="analyze-button"]')
    expect((btn.element as HTMLButtonElement).disabled).toBe(true)

    await pickFile(wrapper, imageFile())

    btn = wrapper.find('[data-testid="analyze-button"]')
    expect((btn.element as HTMLButtonElement).disabled).toBe(false)
    wrapper.unmount()
  })

  it('clicking "Analyser" POSTs the file with the selected meal_type', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse(ANALYSIS_PAYLOAD))
    const wrapper = await mountView()

    await pickFile(wrapper, imageFile())
    await wrapper.find('[data-testid="meal-type-select"] select').setValue('dinner')
    await wrapper.find('[data-testid="analyze-button"]').trigger('click')
    await flushPromises()

    expect(fetchSpy).toHaveBeenCalledWith(
      'http://localhost:8001/api/v1/analyze-meal',
      expect.objectContaining({ method: 'POST' }),
    )
    const init = fetchSpy.mock.calls[0]![1] as RequestInit
    const body = init.body as FormData
    expect(body.get('meal_type')).toBe('dinner')
    wrapper.unmount()
  })

  it('renders the result section after a successful analysis', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse(ANALYSIS_PAYLOAD))
    const wrapper = await mountView()

    await pickFile(wrapper, imageFile())
    await wrapper.find('[data-testid="analyze-button"]').trigger('click')
    await flushPromises()

    const result = wrapper.find('[data-testid="analysis-result"]')
    expect(result.exists()).toBe(true)
    expect(result.text()).toContain('Pizza margherita')
    expect(result.text()).toContain('Salade verte')
    expect(result.text()).toContain('720')
    expect(result.text()).toContain('28')
    expect(result.text()).toContain('Pense à ajouter une portion de légumes verts')
    expect(result.text().toLowerCase()).toContain('mistral')
    wrapper.unmount()
  })

  it('renders detected foods with their confidence as a percentage', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse(ANALYSIS_PAYLOAD))
    const wrapper = await mountView()

    await pickFile(wrapper, imageFile())
    await wrapper.find('[data-testid="analyze-button"]').trigger('click')
    await flushPromises()

    const foods = wrapper.find('[data-testid="detected-foods"]')
    expect(foods.text()).toMatch(/92\s*%/)
    expect(foods.text()).toMatch(/68\s*%/)
    wrapper.unmount()
  })

  it('shows a loading skeleton while the request is in flight', async () => {
    let resolveFetch: (response: Response) => void = () => {}
    fetchSpy.mockImplementationOnce(
      () => new Promise<Response>((resolve) => { resolveFetch = resolve })
    )
    const wrapper = await mountView()

    await pickFile(wrapper, imageFile())
    await wrapper.find('[data-testid="analyze-button"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="analysis-skeleton"]').exists()).toBe(true)

    resolveFetch(jsonResponse(ANALYSIS_PAYLOAD))
    await flushPromises()

    expect(wrapper.find('[data-testid="analysis-skeleton"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('"Nouvelle analyse" returns to the dropzone state', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse(ANALYSIS_PAYLOAD))
    const wrapper = await mountView()

    await pickFile(wrapper, imageFile())
    await wrapper.find('[data-testid="analyze-button"]').trigger('click')
    await flushPromises()

    await wrapper.find('[data-testid="reset-button"]').trigger('click')

    expect(wrapper.find('[data-testid="analysis-result"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="dropzone"]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('shows the rate-limit banner with the retryAfter value on 429', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response('Too Many Requests', { status: 429, headers: { 'Retry-After': '25' } }),
    )
    const wrapper = await mountView()

    await pickFile(wrapper, imageFile())
    await wrapper.find('[data-testid="analyze-button"]').trigger('click')
    await flushPromises()

    const banner = wrapper.find('[data-testid="rate-limit"]')
    expect(banner.exists()).toBe(true)
    expect(banner.text()).toContain('25')
    wrapper.unmount()
  })

  it('shows an error message when the service is down (5xx)', async () => {
    fetchSpy.mockResolvedValueOnce(new Response('Service Unavailable', { status: 503 }))
    const wrapper = await mountView()

    await pickFile(wrapper, imageFile())
    await wrapper.find('[data-testid="analyze-button"]').trigger('click')
    await flushPromises()

    const banner = wrapper.find('[data-testid="analysis-error"]')
    expect(banner.exists()).toBe(true)
    expect(banner.text().toLowerCase()).toMatch(/indisponible|impossible/i)
    wrapper.unmount()
  })

  it('disables the "Analyser" button for 60 seconds after submitting', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    fetchSpy.mockResolvedValueOnce(jsonResponse(ANALYSIS_PAYLOAD))
    const wrapper = await mountView()

    await pickFile(wrapper, imageFile())
    await wrapper.find('[data-testid="analyze-button"]').trigger('click')
    await flushPromises()

    await wrapper.find('[data-testid="reset-button"]').trigger('click')
    await pickFile(wrapper, imageFile())

    let btn = wrapper.find('[data-testid="analyze-button"]')
    expect((btn.element as HTMLButtonElement).disabled).toBe(true)
    expect(wrapper.find('[data-testid="cooldown"]').exists()).toBe(true)

    vi.advanceTimersByTime(60_000)
    await flushPromises()

    btn = wrapper.find('[data-testid="analyze-button"]')
    expect((btn.element as HTMLButtonElement).disabled).toBe(false)
    expect(wrapper.find('[data-testid="cooldown"]').exists()).toBe(false)
    wrapper.unmount()
    vi.useRealTimers()
  })

  it('shows a dropzone size error when a file > 10 MB is dropped', async () => {
    const wrapper = await mountView()
    const big = imageFile('big.jpg', 11 * 1024 * 1024, 'image/jpeg')

    await wrapper.find('[data-testid="dropzone"]').trigger('drop', {
      dataTransfer: { files: [big] } as unknown as DataTransfer,
    })

    const err = wrapper.find('[data-testid="dropzone-error"]')
    expect(err.exists()).toBe(true)
    expect(err.text().toLowerCase()).toMatch(/10\s*mo|dépasse|trop\s*lourd/)
    wrapper.unmount()
  })

  it('includes a link to the placeholder /meal-history route', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse(ANALYSIS_PAYLOAD))
    const wrapper = await mountView()

    await pickFile(wrapper, imageFile())
    await wrapper.find('[data-testid="analyze-button"]').trigger('click')
    await flushPromises()

    const historyLink = wrapper.find('[data-testid="history-link"]')
    expect(historyLink.exists()).toBe(true)
    wrapper.unmount()
  })
})
