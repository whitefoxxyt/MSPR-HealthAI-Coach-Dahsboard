import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import FitnessProgramHistoryView from '../FitnessProgramHistoryView.vue'

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

function exercise(id: number, name: string) {
  return {
    id,
    name,
    target_muscles: ['chest'],
    equipment: ['dumbbell'],
    difficulty: 'intermediate',
    category: 'compound',
  }
}

function programFixture(
  id: string,
  options: Partial<{
    createdAt: string
    healthGoal: string
    tier: string
    durationWeeks: number
    durationMinPerSession: number
    sessionsPerWeek: number
  }> = {},
) {
  const {
    createdAt = '2026-05-20T12:00:00Z',
    healthGoal = 'muscle_strength',
    tier = 'premium',
    durationWeeks = 4,
    durationMinPerSession = 60,
    sessionsPerWeek = 3,
  } = options

  const sessions = Array.from({ length: sessionsPerWeek }, (_, i) => [exercise(i + 1, `Move ${i + 1}`)])
  const weeks = Array.from({ length: durationWeeks }, () => sessions)

  return {
    program_id: id,
    user_id: 'user-1',
    duration_weeks: durationWeeks,
    scoring_strategy: 'hybrid_rank_fusion',
    tier_at_generation: tier,
    health_goal_at_generation: healthGoal,
    duration_min_per_session: durationMinPerSession,
    weeks,
    created_at: createdAt,
  }
}

function historyPayload(items: ReturnType<typeof programFixture>[], total: number, limit: number, offset: number) {
  return { items, total, limit, offset }
}

function createTestRouter(): Router {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/fitness-programs', name: 'fitness-programs', component: FitnessProgramHistoryView },
      {
        path: '/fitness-programs/:id',
        name: 'fitness-program-detail',
        component: { template: '<div data-testid="detail-stub"></div>' },
      },
      { path: '/fitness-program', name: 'fitness-program', component: { template: '<div data-testid="generator-stub"></div>' } },
      { path: '/', component: { template: '<div />' } },
    ],
  })
}

async function mountView() {
  const router = createTestRouter()
  await router.push('/fitness-programs')
  await router.isReady()
  const wrapper = mount(FitnessProgramHistoryView, {
    global: { plugins: [createPinia(), router] },
  })
  return { wrapper, router }
}

function mockFetchInOrder(
  spy: ReturnType<typeof vi.spyOn>,
  responses: Array<() => Response | Promise<Response>>,
) {
  spy.mockImplementation(() => {
    const next = responses.shift()
    if (!next) {
      throw new Error('Unexpected fetch call (no more mocked responses)')
    }
    return Promise.resolve(next())
  })
}

describe('FitnessProgramHistoryView', () => {
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

  it('fetches the first page of programs on mount with limit=10 offset=0', async () => {
    mockFetchInOrder(fetchSpy, [() => jsonResponse(historyPayload([programFixture('p-1')], 1, 10, 0))])

    await mountView()
    await flushPromises()

    const calls = fetchSpy.mock.calls.map((args: unknown[]) => args[0])
    expect(calls).toContain('http://localhost:8002/api/v1/programs/me?limit=10&offset=0')
  })

  it('renders the page title "Historique programmes"', async () => {
    mockFetchInOrder(fetchSpy, [() => jsonResponse(historyPayload([programFixture('p-1')], 1, 10, 0))])

    const { wrapper } = await mountView()
    await flushPromises()

    expect(wrapper.text()).toMatch(/historique programmes/i)
  })

  it('renders one card per program with the program id', async () => {
    mockFetchInOrder(fetchSpy, [
      () =>
        jsonResponse(
          historyPayload(
            [programFixture('prog-aaa'), programFixture('prog-bbb')],
            2,
            10,
            0,
          ),
        ),
    ])

    const { wrapper } = await mountView()
    await flushPromises()

    const cards = wrapper.findAll('[data-testid="program-history-card"]')
    expect(cards.length).toBe(2)
    expect(cards[0]!.text()).toContain('prog-aaa')
    expect(cards[1]!.text()).toContain('prog-bbb')
  })

  it('shows the goal tag, tier, days and duration on each card', async () => {
    mockFetchInOrder(fetchSpy, [
      () =>
        jsonResponse(
          historyPayload(
            [
              programFixture('prog-aaa', {
                healthGoal: 'muscle_strength',
                tier: 'premium',
                durationWeeks: 4,
                sessionsPerWeek: 3,
                durationMinPerSession: 60,
              }),
            ],
            1,
            10,
            0,
          ),
        ),
    ])

    const { wrapper } = await mountView()
    await flushPromises()

    const card = wrapper.find('[data-testid="program-history-card"]')
    expect(card.text()).toContain('Force')
    expect(card.text()).toContain('premium')
    // 4 weeks × 3 sessions = 12 sessions
    expect(card.text()).toContain('12')
    // 12 sessions × 60 min = 720 min → "12h"
    expect(card.text()).toMatch(/12\s*h/)
  })

  it('shows the "X sur Y" counter using current count and total', async () => {
    mockFetchInOrder(fetchSpy, [
      () =>
        jsonResponse(
          historyPayload(
            [programFixture('p-1'), programFixture('p-2')],
            5,
            10,
            0,
          ),
        ),
    ])

    const { wrapper } = await mountView()
    await flushPromises()

    const counter = wrapper.find('[data-testid="history-counter"]')
    expect(counter.exists()).toBe(true)
    expect(counter.text()).toMatch(/2\s*sur\s*5/i)
  })

  it('shows the "Charger plus" CTA when more pages are available', async () => {
    mockFetchInOrder(fetchSpy, [
      () =>
        jsonResponse(historyPayload([programFixture('p-1')], 5, 10, 0)),
    ])

    const { wrapper } = await mountView()
    await flushPromises()

    expect(wrapper.find('[data-testid="history-load-more"]').exists()).toBe(true)
  })

  it('hides the "Charger plus" CTA when everything is loaded', async () => {
    mockFetchInOrder(fetchSpy, [
      () =>
        jsonResponse(
          historyPayload([programFixture('p-1'), programFixture('p-2')], 2, 10, 0),
        ),
    ])

    const { wrapper } = await mountView()
    await flushPromises()

    expect(wrapper.find('[data-testid="history-load-more"]').exists()).toBe(false)
  })

  it('clicking "Charger plus" fetches the next page and appends the new cards', async () => {
    mockFetchInOrder(fetchSpy, [
      () =>
        jsonResponse(historyPayload([programFixture('p-1'), programFixture('p-2')], 4, 2, 0)),
      () =>
        jsonResponse(historyPayload([programFixture('p-3'), programFixture('p-4')], 4, 2, 2)),
    ])

    const { wrapper } = await mountView()
    await flushPromises()

    expect(wrapper.findAll('[data-testid="program-history-card"]').length).toBe(2)

    await wrapper.find('[data-testid="history-load-more"]').trigger('click')
    await flushPromises()

    const cards = wrapper.findAll('[data-testid="program-history-card"]')
    expect(cards.length).toBe(4)
    expect(cards[2]!.text()).toContain('p-3')
    expect(cards[3]!.text()).toContain('p-4')
  })

  it('shows the empty state with a link to /fitness-program when there is no program', async () => {
    mockFetchInOrder(fetchSpy, [() => jsonResponse(historyPayload([], 0, 10, 0))])

    const { wrapper } = await mountView()
    await flushPromises()

    const empty = wrapper.find('[data-testid="history-empty"]')
    expect(empty.exists()).toBe(true)
    expect(empty.html()).toMatch(/\/fitness-program(?!s)/)
  })

  it('clicking a card navigates to /fitness-programs/:id', async () => {
    mockFetchInOrder(fetchSpy, [
      () => jsonResponse(historyPayload([programFixture('prog-xyz')], 1, 10, 0)),
    ])

    const { wrapper, router } = await mountView()
    await flushPromises()

    const link = wrapper.find('[data-testid="program-history-card"] a')
    expect(link.attributes('href')).toBe('/fitness-programs/prog-xyz')

    await link.trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.fullPath).toBe('/fitness-programs/prog-xyz')
  })

  it('shows the loading skeleton while fetching the first page', async () => {
    let resolveFirst: ((response: Response) => void) | null = null
    const pending = new Promise<Response>((resolve) => {
      resolveFirst = resolve
    })
    mockFetchInOrder(fetchSpy, [() => pending])

    const { wrapper } = await mountView()
    await Promise.resolve()

    expect(wrapper.find('[data-testid="history-skeleton"]').exists()).toBe(true)

    resolveFirst!(jsonResponse(historyPayload([programFixture('p-1')], 1, 10, 0)))
    await flushPromises()

    expect(wrapper.find('[data-testid="history-skeleton"]').exists()).toBe(false)
  })

  it('shows an error banner when the backend returns 5xx', async () => {
    mockFetchInOrder(fetchSpy, [() => new Response('Server Error', { status: 503 })])

    const { wrapper } = await mountView()
    await flushPromises()

    const banner = wrapper.find('[data-testid="history-error"]')
    expect(banner.exists()).toBe(true)
    expect(banner.text()).toMatch(/indisponible|impossible|erreur/i)
  })

  it('shows the rate-limit banner with retry-after on 429', async () => {
    mockFetchInOrder(fetchSpy, [
      () =>
        new Response('Too Many Requests', {
          status: 429,
          headers: { 'Retry-After': '18' },
        }),
    ])

    const { wrapper } = await mountView()
    await flushPromises()

    const banner = wrapper.find('[data-testid="history-rate-limit"]')
    expect(banner.exists()).toBe(true)
    expect(banner.text()).toContain('18')
  })
})
