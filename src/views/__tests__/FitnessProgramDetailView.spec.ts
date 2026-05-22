import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import FitnessProgramDetailView from '../FitnessProgramDetailView.vue'

const AUTH_STORAGE_KEY = 'healthai.auth.session'

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
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

function programFixture(id: string) {
  return {
    program_id: id,
    user_id: 'user-1',
    duration_weeks: 1,
    scoring_strategy: 'hybrid_rank_fusion',
    tier_at_generation: 'premium',
    health_goal_at_generation: 'endurance',
    duration_min_per_session: 45,
    weeks: [
      [
        [exercise(10, 'Bench Press'), exercise(11, 'Overhead Press')],
        [exercise(12, 'Squat')],
      ],
    ],
    created_at: '2026-05-18T09:00:00Z',
  }
}

function createTestRouter(): Router {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/fitness-programs/:id',
        name: 'fitness-program-detail',
        component: FitnessProgramDetailView,
      },
      {
        path: '/fitness-programs',
        name: 'fitness-programs',
        component: { template: '<div data-testid="history-stub"></div>' },
      },
      { path: '/', component: { template: '<div />' } },
    ],
  })
}

async function mountView(id: string) {
  const router = createTestRouter()
  await router.push(`/fitness-programs/${id}`)
  await router.isReady()
  const wrapper = mount(FitnessProgramDetailView, {
    global: { plugins: [createPinia(), router] },
  })
  return { wrapper, router }
}

describe('FitnessProgramDetailView', () => {
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

  it('fetches the history on mount and renders the program matching the route id', async () => {
    fetchSpy.mockResolvedValueOnce(
      jsonResponse({ items: [programFixture('prog-xyz')], total: 1, limit: 50, offset: 0 }),
    )

    const { wrapper } = await mountView('prog-xyz')
    await flushPromises()

    const summary = wrapper.find('[data-testid="program-summary"]')
    expect(summary.exists()).toBe(true)
    expect(summary.text()).toContain('prog-xyz')
  })

  it('renders one WorkoutCard per exercise in every session, like the generator view', async () => {
    fetchSpy.mockResolvedValueOnce(
      jsonResponse({ items: [programFixture('prog-xyz')], total: 1, limit: 50, offset: 0 }),
    )

    const { wrapper } = await mountView('prog-xyz')
    await flushPromises()

    const cards = wrapper.findAll('[data-testid="workout-card"]')
    expect(cards.length).toBe(3)
    expect(wrapper.text()).toContain('Bench Press')
    expect(wrapper.text()).toContain('Overhead Press')
    expect(wrapper.text()).toContain('Squat')
  })

  it('maps health_goal_at_generation="endurance" to the "Endurance" tag in the summary', async () => {
    fetchSpy.mockResolvedValueOnce(
      jsonResponse({ items: [programFixture('prog-xyz')], total: 1, limit: 50, offset: 0 }),
    )

    const { wrapper } = await mountView('prog-xyz')
    await flushPromises()

    const summary = wrapper.find('[data-testid="program-summary"]')
    expect(summary.text()).toContain('Endurance')
  })

  it('renders a "Programme introuvable" empty state with a link back to /fitness-programs when not found', async () => {
    fetchSpy.mockResolvedValueOnce(
      jsonResponse({ items: [programFixture('prog-other')], total: 1, limit: 50, offset: 0 }),
    )

    const { wrapper } = await mountView('prog-missing')
    await flushPromises()

    const notFound = wrapper.find('[data-testid="program-not-found"]')
    expect(notFound.exists()).toBe(true)
    expect(notFound.html()).toMatch(/\/fitness-programs(?!\/)/)
  })

  it('shows a loading state while the history fetch is in flight', async () => {
    let resolveFn: ((response: Response) => void) | null = null
    const pending = new Promise<Response>((resolve) => {
      resolveFn = resolve
    })
    fetchSpy.mockImplementation(() => pending)

    const { wrapper } = await mountView('prog-xyz')
    await Promise.resolve()

    expect(wrapper.find('[data-testid="detail-loading"]').exists()).toBe(true)

    resolveFn!(jsonResponse({ items: [programFixture('prog-xyz')], total: 1, limit: 50, offset: 0 }))
    await flushPromises()

    expect(wrapper.find('[data-testid="detail-loading"]').exists()).toBe(false)
  })

  it('shows an error banner when the backend returns 5xx (instead of a misleading "introuvable")', async () => {
    fetchSpy.mockResolvedValueOnce(new Response('Server Error', { status: 503 }))

    const { wrapper } = await mountView('prog-xyz')
    await flushPromises()

    const banner = wrapper.find('[data-testid="detail-error"]')
    expect(banner.exists()).toBe(true)
    expect(banner.text()).toMatch(/indisponible|erreur/i)
    expect(wrapper.find('[data-testid="program-not-found"]').exists()).toBe(false)
  })

  it('shows the rate-limit banner with retry-after on 429', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response('Too Many Requests', {
        status: 429,
        headers: { 'Retry-After': '21' },
      }),
    )

    const { wrapper } = await mountView('prog-xyz')
    await flushPromises()

    const banner = wrapper.find('[data-testid="detail-rate-limit"]')
    expect(banner.exists()).toBe(true)
    expect(banner.text()).toContain('21')
    expect(wrapper.find('[data-testid="program-not-found"]').exists()).toBe(false)
  })
})
