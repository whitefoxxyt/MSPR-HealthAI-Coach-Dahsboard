import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import FitnessProgramView from '../FitnessProgramView.vue'

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

const FITNESS_PROFILE = {
  user_id: 'user-1',
  health_goal_fitness: 'muscle_strength',
  experience_level: 'intermediate',
  equipment: ['dumbbell', 'bench'],
  limitations: [],
  preferences: { duration_min_per_session: 60, sessions_per_week: 4 },
  updated_at: '2026-05-22T12:00:00Z',
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

const PROGRAM = {
  program_id: 'prog-abc-123',
  user_id: 'user-1',
  duration_weeks: 4,
  scoring_strategy: 'hybrid_rank_fusion',
  tier_at_generation: 'premium',
  weeks: [
    [
      [exercise(1, 'Bench Press'), exercise(2, 'Overhead Press')],
      [exercise(3, 'Squat')],
    ],
  ],
  created_at: '2026-05-22T12:00:00Z',
}

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/fitness-program', component: FitnessProgramView },
      { path: '/profil', name: 'profile', component: { template: '<div />' } },
      { path: '/', component: { template: '<div />' } },
    ],
  })
}

async function mountView() {
  const router = createTestRouter()
  await router.push('/fitness-program')
  await router.isReady()
  return mount(FitnessProgramView, {
    global: { plugins: [createPinia(), router] },
  })
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

describe('FitnessProgramView', () => {
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

  it('fetches the fitness profile on mount', async () => {
    mockFetchInOrder(fetchSpy, [() => jsonResponse(FITNESS_PROFILE)])

    await mountView()
    await flushPromises()

    const calls = fetchSpy.mock.calls.map((args: unknown[]) => args[0])
    expect(calls).toContain('http://localhost:8002/api/v1/fitness-profile/me')
  })

  it('renders the page title "Programme fitness"', async () => {
    mockFetchInOrder(fetchSpy, [() => jsonResponse(FITNESS_PROFILE)])

    const wrapper = await mountView()
    await flushPromises()

    expect(wrapper.text()).toMatch(/programme fitness/i)
  })

  it('shows the EmptyState with a link to /profil when the fitness profile is missing', async () => {
    mockFetchInOrder(fetchSpy, [() => new Response('Not Found', { status: 404 })])

    const wrapper = await mountView()
    await flushPromises()

    const empty = wrapper.find('[data-testid="fitness-profile-missing"]')
    expect(empty.exists()).toBe(true)
    expect(empty.html()).toMatch(/\/profil/)
  })

  it('shows the "Générer un programme" CTA when the profile is present', async () => {
    mockFetchInOrder(fetchSpy, [() => jsonResponse(FITNESS_PROFILE)])

    const wrapper = await mountView()
    await flushPromises()

    const cta = wrapper.find('[data-testid="generate-program-cta"]')
    expect(cta.exists()).toBe(true)
    expect(cta.text()).toMatch(/g[ée]n[ée]rer/i)
  })

  it('clicking the CTA POSTs to /api/v1/recommendations and renders the resulting program', async () => {
    mockFetchInOrder(fetchSpy, [
      () => jsonResponse(FITNESS_PROFILE),
      () => jsonResponse(PROGRAM),
    ])

    const wrapper = await mountView()
    await flushPromises()

    await wrapper.find('[data-testid="generate-program-cta"]').trigger('click')
    await flushPromises()

    const postCall = fetchSpy.mock.calls.find(
      (args: unknown[]) =>
        args[0] === 'http://localhost:8002/api/v1/recommendations'
        && (args[1] as RequestInit)?.method === 'POST',
    )
    expect(postCall).toBeDefined()

    const summary = wrapper.find('[data-testid="program-summary"]')
    expect(summary.exists()).toBe(true)
    expect(summary.text()).toContain('prog-abc-123')

    const cards = wrapper.findAll('[data-testid="workout-card"]')
    expect(cards.length).toBe(3)
    expect(wrapper.text()).toContain('Bench Press')
    expect(wrapper.text()).toContain('Overhead Press')
    expect(wrapper.text()).toContain('Squat')
  })

  it('maps health_goal_fitness="muscle_strength" to the "Force" tag in the summary', async () => {
    mockFetchInOrder(fetchSpy, [
      () => jsonResponse(FITNESS_PROFILE),
      () => jsonResponse(PROGRAM),
    ])

    const wrapper = await mountView()
    await flushPromises()
    await wrapper.find('[data-testid="generate-program-cta"]').trigger('click')
    await flushPromises()

    const summary = wrapper.find('[data-testid="program-summary"]')
    expect(summary.text()).toContain('Force')
  })

  it('shows the loading skeleton while generating', async () => {
    let resolveGenerate: ((response: Response) => void) | null = null
    const pending = new Promise<Response>((resolve) => {
      resolveGenerate = resolve
    })
    mockFetchInOrder(fetchSpy, [
      () => jsonResponse(FITNESS_PROFILE),
      () => pending,
    ])

    const wrapper = await mountView()
    await flushPromises()

    await wrapper.find('[data-testid="generate-program-cta"]').trigger('click')
    await Promise.resolve()

    expect(wrapper.find('[data-testid="program-skeleton"]').exists()).toBe(true)

    resolveGenerate!(jsonResponse(PROGRAM))
    await flushPromises()

    expect(wrapper.find('[data-testid="program-skeleton"]').exists()).toBe(false)
  })

  it('shows the rate-limit banner with retry-after on 429', async () => {
    mockFetchInOrder(fetchSpy, [
      () => jsonResponse(FITNESS_PROFILE),
      () => new Response('Too Many Requests', {
        status: 429,
        headers: { 'Retry-After': '25' },
      }),
    ])

    const wrapper = await mountView()
    await flushPromises()

    await wrapper.find('[data-testid="generate-program-cta"]').trigger('click')
    await flushPromises()

    const banner = wrapper.find('[data-testid="program-rate-limit"]')
    expect(banner.exists()).toBe(true)
    expect(banner.text()).toContain('25')
  })

  it('shows an error banner when generate returns 5xx', async () => {
    mockFetchInOrder(fetchSpy, [
      () => jsonResponse(FITNESS_PROFILE),
      () => new Response('Server Error', { status: 503 }),
    ])

    const wrapper = await mountView()
    await flushPromises()

    await wrapper.find('[data-testid="generate-program-cta"]').trigger('click')
    await flushPromises()

    const banner = wrapper.find('[data-testid="program-error"]')
    expect(banner.exists()).toBe(true)
    expect(banner.text()).toMatch(/indisponible|impossible|erreur/i)
  })

  it('shows a "Nouveau programme" CTA after a program has been generated', async () => {
    mockFetchInOrder(fetchSpy, [
      () => jsonResponse(FITNESS_PROFILE),
      () => jsonResponse(PROGRAM),
    ])

    const wrapper = await mountView()
    await flushPromises()
    await wrapper.find('[data-testid="generate-program-cta"]').trigger('click')
    await flushPromises()

    const newCta = wrapper.find('[data-testid="new-program-cta"]')
    expect(newCta.exists()).toBe(true)
    expect(newCta.text()).toMatch(/nouveau programme/i)
  })

  it('renders placeholder links to history and feedback (S8/S9 follow-ups)', async () => {
    mockFetchInOrder(fetchSpy, [
      () => jsonResponse(FITNESS_PROFILE),
      () => jsonResponse(PROGRAM),
    ])

    const wrapper = await mountView()
    await flushPromises()
    await wrapper.find('[data-testid="generate-program-cta"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="program-history-link"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="program-feedback-link"]').exists()).toBe(true)
  })
})
