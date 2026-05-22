import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import MealPlanHistoryView from '../MealPlanHistoryView.vue'

const AUTH_STORAGE_KEY = 'healthai.auth.session'
const LIST_URL_BASE = 'http://localhost:8001/api/v1/meal-plans/me'

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

const SAMPLE_MEAL = {
  name: 'Porridge banane',
  macros: { calories: 420, protein_g: 18, carbs_g: 68, fat_g: 9, fiber_g: null },
  ingredients: ['flocons avoine', 'banane', 'lait'],
  budget_eur: 1.8,
  prep_time_min: 10,
}

const SAMPLE_DAYS = [
  {
    day: 1,
    breakfast: SAMPLE_MEAL,
    lunch: { ...SAMPLE_MEAL, name: 'Bowl quinoa' },
    dinner: { ...SAMPLE_MEAL, name: 'Saumon vapeur' },
  },
  {
    day: 2,
    breakfast: { ...SAMPLE_MEAL, name: 'Pancakes' },
    lunch: { ...SAMPLE_MEAL, name: 'Salade thon' },
    dinner: { ...SAMPLE_MEAL, name: 'Poulet riz' },
  },
]

function summary(overrides: Partial<{
  id: string
  created_at: string
  health_goal: string | null
  diet_type: string
  duration_days: number
  total_budget_eur: number
}> = {}) {
  return {
    id: overrides.id ?? 'plan-1',
    created_at: overrides.created_at ?? '2026-05-20T14:32:00Z',
    health_goal: overrides.health_goal ?? 'muscle_gain',
    diet_type: overrides.diet_type ?? 'omnivore',
    duration_days: overrides.duration_days ?? 3,
    total_budget_eur: overrides.total_budget_eur ?? 36,
    llm_backend_used: 'ollama',
    days: SAMPLE_DAYS,
  }
}

function listResponse(items: ReturnType<typeof summary>[], total: number, limit = 10, offset = 0) {
  return { items, total, limit, offset }
}

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/meal-plans', name: 'meal-plan-history', component: MealPlanHistoryView },
      { path: '/meal-plan', name: 'meal-plan', component: { template: '<div />' } },
      { path: '/', component: { template: '<div />' } },
    ],
  })
}

async function mountView() {
  const router = createTestRouter()
  await router.push('/meal-plans')
  await router.isReady()
  return mount(MealPlanHistoryView, {
    global: { plugins: [createPinia(), router] },
  })
}

function mockFetchInOrder(spy: ReturnType<typeof vi.spyOn>, responses: Array<() => Response>) {
  spy.mockImplementation(() => {
    const next = responses.shift()
    if (!next) {
      throw new Error('Unexpected fetch call (no more mocked responses)')
    }
    return Promise.resolve(next())
  })
}

describe('MealPlanHistoryView', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    setActivePinia(createPinia())
    seedAuthSession()
    fetchSpy = vi.spyOn(globalThis, 'fetch')
  })

  afterEach(() => {
    fetchSpy.mockRestore()
    localStorage.removeItem(AUTH_STORAGE_KEY)
  })

  describe('initial load', () => {
    it('fetches /api/v1/meal-plans/me?limit=10&offset=0 on mount', async () => {
      mockFetchInOrder(fetchSpy, [() => jsonResponse(listResponse([], 0))])

      await mountView()
      await flushPromises()

      const call = fetchSpy.mock.calls.find(
        (args: unknown[]) => typeof args[0] === 'string' && (args[0] as string).startsWith(LIST_URL_BASE),
      )
      expect(call).toBeDefined()
      expect(call![0]).toBe(`${LIST_URL_BASE}?limit=10&offset=0`)
    })

    it('shows the EmptyState with a link to /meal-plan when no plans exist', async () => {
      mockFetchInOrder(fetchSpy, [() => jsonResponse(listResponse([], 0))])

      const wrapper = await mountView()
      await flushPromises()

      const empty = wrapper.find('[data-testid="meal-plan-history-empty"]')
      expect(empty.exists()).toBe(true)
      const link = empty.find('a[href="/meal-plan"]')
      expect(link.exists()).toBe(true)
      expect(link.text().toLowerCase()).toMatch(/g[ée]n[ée]rer/)
    })

    it('renders a card per plan with date, goal, diet, duration and total budget', async () => {
      mockFetchInOrder(fetchSpy, [
        () =>
          jsonResponse(
            listResponse(
              [
                summary({
                  id: 'plan-a',
                  created_at: '2026-05-20T14:32:00Z',
                  health_goal: 'muscle_gain',
                  diet_type: 'omnivore',
                  duration_days: 3,
                  total_budget_eur: 36.5,
                }),
                summary({
                  id: 'plan-b',
                  created_at: '2026-05-18T08:10:00Z',
                  health_goal: 'weight_loss',
                  diet_type: 'vegetarien',
                  duration_days: 7,
                  total_budget_eur: 84,
                }),
              ],
              2,
            ),
          ),
      ])

      const wrapper = await mountView()
      await flushPromises()

      const cards = wrapper.findAll('[data-testid="meal-plan-history-card"]')
      expect(cards).toHaveLength(2)

      const firstText = cards[0]!.text()
      expect(firstText.toLowerCase()).toMatch(/muscle|prise/)
      expect(firstText.toLowerCase()).toMatch(/omnivore/)
      expect(firstText).toMatch(/3\s*j/i)
      expect(firstText).toContain('36')

      const secondText = cards[1]!.text()
      expect(secondText.toLowerCase()).toMatch(/v[ée]g[ée]tarien/)
      expect(secondText).toMatch(/7\s*j/i)
      expect(secondText).toContain('84')
    })

    it('shows the "X sur Y" counter', async () => {
      mockFetchInOrder(fetchSpy, [
        () =>
          jsonResponse(
            listResponse([summary({ id: 'plan-a' }), summary({ id: 'plan-b' })], 5),
          ),
      ])

      const wrapper = await mountView()
      await flushPromises()

      const counter = wrapper.find('[data-testid="meal-plan-history-counter"]')
      expect(counter.exists()).toBe(true)
      expect(counter.text()).toMatch(/2\s*sur\s*5/i)
    })
  })

  describe('pagination', () => {
    it('renders a "Charger plus" button when items.length < total', async () => {
      mockFetchInOrder(fetchSpy, [
        () => jsonResponse(listResponse([summary({ id: 'plan-a' })], 3)),
      ])

      const wrapper = await mountView()
      await flushPromises()

      const more = wrapper.find('[data-testid="meal-plan-history-more"]')
      expect(more.exists()).toBe(true)
    })

    it('hides the "Charger plus" button when items.length === total', async () => {
      mockFetchInOrder(fetchSpy, [
        () => jsonResponse(listResponse([summary({ id: 'plan-a' })], 1)),
      ])

      const wrapper = await mountView()
      await flushPromises()

      const more = wrapper.find('[data-testid="meal-plan-history-more"]')
      expect(more.exists()).toBe(false)
    })

    it('clicking "Charger plus" fetches the next page with the right offset', async () => {
      mockFetchInOrder(fetchSpy, [
        () => jsonResponse(listResponse([summary({ id: 'plan-a' })], 2, 10, 0)),
        () => jsonResponse(listResponse([summary({ id: 'plan-b' })], 2, 10, 1)),
      ])

      const wrapper = await mountView()
      await flushPromises()

      // Advance time past TTL so the second call is not a cache hit.
      vi.useFakeTimers()
      vi.setSystemTime(Date.now() + 31_000)

      await wrapper.find('[data-testid="meal-plan-history-more"]').trigger('click')
      await flushPromises()
      vi.useRealTimers()

      const secondCall = fetchSpy.mock.calls[1]![0] as string
      expect(secondCall).toBe(`${LIST_URL_BASE}?limit=10&offset=1`)

      const cards = wrapper.findAll('[data-testid="meal-plan-history-card"]')
      expect(cards).toHaveLength(2)
    })
  })

  describe('detail view', () => {
    it('clicking a card opens the detail view with MealCalendar rendered inside', async () => {
      mockFetchInOrder(fetchSpy, [
        () => jsonResponse(listResponse([summary({ id: 'plan-a' })], 1)),
      ])

      const wrapper = await mountView()
      await flushPromises()

      expect(wrapper.find('[data-testid="meal-plan-history-detail"]').exists()).toBe(false)

      await wrapper.find('[data-testid="meal-plan-history-card"]').trigger('click')
      await flushPromises()

      const detail = wrapper.find('[data-testid="meal-plan-history-detail"]')
      expect(detail.exists()).toBe(true)
      expect(detail.find('[data-testid="meal-calendar-grid"]').exists()).toBe(true)
      // SAMPLE_DAYS has 2 days
      expect(detail.findAll('[data-testid="meal-day"]')).toHaveLength(2)
    })

    it('detail view closes when the user clicks the close control', async () => {
      mockFetchInOrder(fetchSpy, [
        () => jsonResponse(listResponse([summary({ id: 'plan-a' })], 1)),
      ])

      const wrapper = await mountView()
      await flushPromises()

      await wrapper.find('[data-testid="meal-plan-history-card"]').trigger('click')
      expect(wrapper.find('[data-testid="meal-plan-history-detail"]').exists()).toBe(true)

      await wrapper.find('[data-testid="meal-plan-history-detail-close"]').trigger('click')
      await flushPromises()

      expect(wrapper.find('[data-testid="meal-plan-history-detail"]').exists()).toBe(false)
    })
  })
})
