import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import MealAnalysisHistoryView from '../MealAnalysisHistoryView.vue'

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

function historyItem(overrides: Record<string, unknown> = {}) {
  return {
    id: 'analysis-1',
    created_at: '2026-05-20T12:34:56Z',
    meal_type: 'lunch',
    image_url: 'http://files.local/meal-1.png',
    detected_foods: [
      { name: 'Pizza margherita', confidence: 0.92 },
      { name: 'Salade verte', confidence: 0.68 },
      { name: 'Eau', confidence: 0.5 },
    ],
    macros: { calories: 720, protein_g: 28, carbs_g: 82, fat_g: 30, fiber_g: 6 },
    insight: 'Pense à ajouter une portion de légumes verts.',
    llm_backend_used: 'mistral',
    ...overrides,
  }
}

function listPage(items: ReturnType<typeof historyItem>[], total: number, limit = 10, offset = 0) {
  return { items, total, limit, offset }
}

function createTestRouter(): Router {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/meal-analyses', component: MealAnalysisHistoryView },
      { path: '/meal-analysis', name: 'meal-analysis', component: { template: '<div />' } },
      { path: '/', component: { template: '<div />' } },
    ],
  })
}

async function mountView() {
  const router = createTestRouter()
  await router.push('/meal-analyses')
  await router.isReady()
  return mount(MealAnalysisHistoryView, {
    global: { plugins: [createPinia(), router] },
    attachTo: document.body,
  })
}

describe('MealAnalysisHistoryView', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    setActivePinia(createPinia())
    seedAuthSession()
    fetchSpy = vi.spyOn(globalThis, 'fetch')
  })

  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.removeItem(AUTH_STORAGE_KEY)
  })

  it('fetches the first page of analyses on mount', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse(listPage([], 0)))
    const wrapper = await mountView()
    await flushPromises()

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/v1\/meal-analyses\/me\?limit=\d+&offset=0$/),
      expect.objectContaining({ method: 'GET' }),
    )
    wrapper.unmount()
  })

  it('renders the empty state with a CTA to /meal-analysis when no analyses', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse(listPage([], 0)))
    const wrapper = await mountView()
    await flushPromises()

    const empty = wrapper.find('[data-testid="empty-state"]')
    expect(empty.exists()).toBe(true)
    const cta = wrapper.find('[data-testid="empty-cta"]')
    expect(cta.exists()).toBe(true)
    expect(cta.attributes('href')).toContain('/meal-analysis')
    wrapper.unmount()
  })

  it('renders a card per analysis with foods and total kcal', async () => {
    fetchSpy.mockResolvedValueOnce(
      jsonResponse(listPage([historyItem()], 1)),
    )
    const wrapper = await mountView()
    await flushPromises()

    const cards = wrapper.findAll('[data-testid="history-card"]')
    expect(cards).toHaveLength(1)
    const text = cards[0]!.text()
    expect(text).toContain('Pizza margherita')
    expect(text).toContain('Salade verte')
    expect(text).toContain('Eau')
    expect(text).toContain('720')
    wrapper.unmount()
  })

  it('renders only the first 3 foods with a +N indicator when more', async () => {
    fetchSpy.mockResolvedValueOnce(
      jsonResponse(
        listPage(
          [
            historyItem({
              detected_foods: [
                { name: 'A', confidence: 0.9 },
                { name: 'B', confidence: 0.8 },
                { name: 'C', confidence: 0.7 },
                { name: 'D', confidence: 0.6 },
                { name: 'E', confidence: 0.5 },
              ],
            }),
          ],
          1,
        ),
      ),
    )
    const wrapper = await mountView()
    await flushPromises()

    const card = wrapper.find('[data-testid="history-card"]')
    const text = card.text()
    expect(text).toContain('A')
    expect(text).toContain('B')
    expect(text).toContain('C')
    expect(text).toContain('+2')
    expect(text).not.toMatch(/\bD\b/)
    expect(text).not.toMatch(/\bE\b/)
    wrapper.unmount()
  })

  it('renders the thumbnail when image_url is present', async () => {
    fetchSpy.mockResolvedValueOnce(
      jsonResponse(listPage([historyItem({ image_url: 'http://files.local/x.png' })], 1)),
    )
    const wrapper = await mountView()
    await flushPromises()

    const img = wrapper.find('[data-testid="history-card"] img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe('http://files.local/x.png')
    wrapper.unmount()
  })

  it('shows a count "X sur Y" reflecting items loaded versus total', async () => {
    fetchSpy.mockResolvedValueOnce(
      jsonResponse(listPage([historyItem({ id: 'a' }), historyItem({ id: 'b' })], 12)),
    )
    const wrapper = await mountView()
    await flushPromises()

    const counter = wrapper.find('[data-testid="history-counter"]')
    expect(counter.text()).toMatch(/2\s*sur\s*12/i)
    wrapper.unmount()
  })

  it('hides the "Charger plus" button when items.length >= total', async () => {
    fetchSpy.mockResolvedValueOnce(
      jsonResponse(listPage([historyItem({ id: 'a' })], 1)),
    )
    const wrapper = await mountView()
    await flushPromises()

    expect(wrapper.find('[data-testid="load-more"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('shows "Charger plus" when more items are available and loads the next page', async () => {
    fetchSpy.mockResolvedValueOnce(
      jsonResponse(listPage([historyItem({ id: 'a' })], 3, 1, 0)),
    )
    const wrapper = await mountView()
    await flushPromises()

    const loadMore = wrapper.find('[data-testid="load-more"]')
    expect(loadMore.exists()).toBe(true)

    fetchSpy.mockResolvedValueOnce(
      jsonResponse(listPage([historyItem({ id: 'b' })], 3, 1, 1)),
    )
    await loadMore.trigger('click')
    await flushPromises()

    const calls = fetchSpy.mock.calls
    expect((calls[1]![0] as string)).toMatch(/offset=1/)
    expect(wrapper.findAll('[data-testid="history-card"]')).toHaveLength(2)
    wrapper.unmount()
  })

  it('clicking a card opens a detail modal with macros, foods and the insight', async () => {
    fetchSpy.mockResolvedValueOnce(
      jsonResponse(
        listPage(
          [historyItem({ insight: 'Bel équilibre du repas.', llm_backend_used: 'ollama' })],
          1,
        ),
      ),
    )
    const wrapper = await mountView()
    await flushPromises()

    expect(document.body.querySelector('[data-testid="detail-modal"]')).toBeNull()

    await wrapper.find('[data-testid="history-card"]').trigger('click')
    await flushPromises()

    const modal = document.body.querySelector('[data-testid="detail-modal"]')
    expect(modal).not.toBeNull()
    const modalText = modal!.textContent ?? ''
    expect(modalText).toContain('Pizza margherita')
    expect(modalText).toContain('Bel équilibre du repas')
    expect(modalText.toLowerCase()).toContain('ollama')
    wrapper.unmount()
  })

  it('shows an error banner when the API responds 5xx', async () => {
    fetchSpy.mockResolvedValueOnce(new Response('Server Error', { status: 503 }))
    const wrapper = await mountView()
    await flushPromises()

    const err = wrapper.find('[data-testid="history-error"]')
    expect(err.exists()).toBe(true)
    expect(err.text().toLowerCase()).toMatch(/indisponible|impossible/)
    wrapper.unmount()
  })

  it('shows a loading skeleton while the initial page is in flight', async () => {
    let resolveFetch: (response: Response) => void = () => {}
    fetchSpy.mockImplementationOnce(
      () => new Promise<Response>((resolve) => { resolveFetch = resolve }),
    )

    const wrapper = await mountView()
    await flushPromises()
    expect(wrapper.find('[data-testid="history-skeleton"]').exists()).toBe(true)

    resolveFetch(jsonResponse(listPage([historyItem()], 1)))
    await flushPromises()

    expect(wrapper.find('[data-testid="history-skeleton"]').exists()).toBe(false)
    wrapper.unmount()
  })
})
