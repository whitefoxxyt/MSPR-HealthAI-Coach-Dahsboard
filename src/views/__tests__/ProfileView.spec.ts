import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import ProfileView from '../ProfileView.vue'

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

const GOALS_PAYLOAD = {
  user_id: 'user-1',
  health_goal: 'muscle_gain',
  calories_target: 2400,
  protein_g: '140.0',
  carbs_g: '260.0',
  fat_g: '80.0',
  allergies: ['arachides'],
  diet_type: 'omnivore',
}

const MACROS_COMPLETE = {
  profile_completion_required: false,
  missing_fields: [],
  tdee: 2450,
  macros: { calories: 2450, protein_g: 184, carbs_g: 276, fat_g: 68 },
}

const MACROS_INCOMPLETE = {
  profile_completion_required: true,
  missing_fields: ['weight_kg', 'height_cm'],
  tdee: null,
  macros: null,
}

const FITNESS_PROFILE_PAYLOAD = {
  user_id: 'user-1',
  health_goal_fitness: 'muscle_strength',
  experience_level: 'intermediate',
  equipment: ['dumbbell', 'bench'],
  limitations: [],
  preferences: { duration_min_per_session: 60, sessions_per_week: 4 },
  updated_at: '2026-05-22T12:00:00Z',
}

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/profil', component: ProfileView },
      { path: '/', component: { template: '<div />' } },
    ],
  })
}

async function mountView() {
  const router = createTestRouter()
  await router.push('/profil')
  await router.isReady()
  return mount(ProfileView, {
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

describe('ProfileView', () => {
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

  it('fetches goals, macros and fitness profile on mount', async () => {
    mockFetchInOrder(fetchSpy, [
      () => jsonResponse(GOALS_PAYLOAD),
      () => jsonResponse(MACROS_COMPLETE),
      () => jsonResponse(FITNESS_PROFILE_PAYLOAD),
    ])

    await mountView()
    await flushPromises()

    const calls = fetchSpy.mock.calls.map((args: unknown[]) => args[0])
    expect(calls).toContain('http://localhost:8001/api/v1/nutrition-goals/me')
    expect(calls).toContain('http://localhost:8001/api/v1/me/macros')
    expect(calls).toContain('http://localhost:8002/api/v1/fitness-profile/me')
  })

  it('renders the three sections (nutrition goals, macros, fitness)', async () => {
    mockFetchInOrder(fetchSpy, [
      () => jsonResponse(GOALS_PAYLOAD),
      () => jsonResponse(MACROS_COMPLETE),
      () => jsonResponse(FITNESS_PROFILE_PAYLOAD),
    ])

    const wrapper = await mountView()
    await flushPromises()

    expect(wrapper.text()).toMatch(/objectifs nutritionnels/i)
    expect(wrapper.text()).toMatch(/macros calcul/i)
    expect(wrapper.text()).toMatch(/profil fitness/i)
  })

  it('pre-fills the nutrition goals form from the API response', async () => {
    mockFetchInOrder(fetchSpy, [
      () => jsonResponse(GOALS_PAYLOAD),
      () => jsonResponse(MACROS_COMPLETE),
      () => jsonResponse(FITNESS_PROFILE_PAYLOAD),
    ])

    const wrapper = await mountView()
    await flushPromises()

    const caloriesInput = wrapper.find('[data-testid="goals-calories"] input')
    expect((caloriesInput.element as HTMLInputElement).value).toBe('2400')

    const proteinInput = wrapper.find('[data-testid="goals-protein"] input')
    expect((proteinInput.element as HTMLInputElement).value).toBe('140')

    const healthGoalSelect = wrapper.find('[data-testid="goals-health-goal"] select')
    expect((healthGoalSelect.element as HTMLSelectElement).value).toBe('muscle_gain')

    const dietSelect = wrapper.find('[data-testid="goals-diet-type"] select')
    expect((dietSelect.element as HTMLSelectElement).value).toBe('omnivore')
  })

  it('shows the TDEE and macros values when the profile is complete', async () => {
    mockFetchInOrder(fetchSpy, [
      () => jsonResponse(GOALS_PAYLOAD),
      () => jsonResponse(MACROS_COMPLETE),
      () => jsonResponse(FITNESS_PROFILE_PAYLOAD),
    ])

    const wrapper = await mountView()
    await flushPromises()

    const section = wrapper.find('[data-testid="macros-section"]')
    expect(section.text()).toContain('2450')
    expect(section.text()).toContain('184')
    expect(section.text()).toContain('276')
    expect(section.text()).toContain('68')
  })

  it('shows the incomplete-profile EmptyState with missing fields when biometric is missing', async () => {
    mockFetchInOrder(fetchSpy, [
      () => jsonResponse(GOALS_PAYLOAD),
      () => jsonResponse(MACROS_INCOMPLETE),
      () => jsonResponse(FITNESS_PROFILE_PAYLOAD),
    ])

    const wrapper = await mountView()
    await flushPromises()

    const section = wrapper.find('[data-testid="macros-section"]')
    expect(section.text()).toMatch(/quelques\s+infos|biom[ée]trie/i)
    expect(section.text()).toContain('Poids (kg)')
    expect(section.text()).toContain('Taille (cm)')
  })

  it('submitting the nutrition goals form issues PUT with the form values', async () => {
    mockFetchInOrder(fetchSpy, [
      () => jsonResponse(GOALS_PAYLOAD),
      () => jsonResponse(MACROS_COMPLETE),
      () => jsonResponse(FITNESS_PROFILE_PAYLOAD),
      () => jsonResponse({ ...GOALS_PAYLOAD, calories_target: 2200 }),
      () => jsonResponse(MACROS_COMPLETE),
    ])

    const wrapper = await mountView()
    await flushPromises()

    const caloriesInput = wrapper.find('[data-testid="goals-calories"] input')
    await caloriesInput.setValue('2200')
    await wrapper.find('[data-testid="goals-form"]').trigger('submit.prevent')
    await flushPromises()

    const putCall = fetchSpy.mock.calls.find(
      (args: unknown[]) => args[0] === 'http://localhost:8001/api/v1/nutrition-goals/me'
        && (args[1] as RequestInit)?.method === 'PUT',
    )
    expect(putCall).toBeDefined()
    const body = JSON.parse((putCall![1] as RequestInit).body as string)
    expect(body.calories_target).toBe(2200)
    expect(body.health_goal).toBe('muscle_gain')
  })

  it('submitting the fitness form issues PUT to the fitness-profile endpoint', async () => {
    mockFetchInOrder(fetchSpy, [
      () => jsonResponse(GOALS_PAYLOAD),
      () => jsonResponse(MACROS_COMPLETE),
      () => jsonResponse(FITNESS_PROFILE_PAYLOAD),
      () => jsonResponse({ ...FITNESS_PROFILE_PAYLOAD, experience_level: 'advanced' }),
    ])

    const wrapper = await mountView()
    await flushPromises()

    await wrapper.find('[data-testid="fitness-level"] select').setValue('advanced')
    await wrapper.find('[data-testid="fitness-form"]').trigger('submit.prevent')
    await flushPromises()

    const putCall = fetchSpy.mock.calls.find(
      (args: unknown[]) => args[0] === 'http://localhost:8002/api/v1/fitness-profile/me'
        && (args[1] as RequestInit)?.method === 'PUT',
    )
    expect(putCall).toBeDefined()
    const body = JSON.parse((putCall![1] as RequestInit).body as string)
    expect(body.experience_level).toBe('advanced')
  })

  it('shows an error banner when fetching the goals returns 5xx', async () => {
    mockFetchInOrder(fetchSpy, [
      () => new Response('Server Error', { status: 503 }),
      () => jsonResponse(MACROS_COMPLETE),
      () => jsonResponse(FITNESS_PROFILE_PAYLOAD),
    ])

    const wrapper = await mountView()
    await flushPromises()

    const banner = wrapper.find('[data-testid="goals-error"]')
    expect(banner.exists()).toBe(true)
    expect(banner.text()).toMatch(/erreur|indisponible/i)
  })

  it('shows the rate-limit banner with retry-after on 429', async () => {
    mockFetchInOrder(fetchSpy, [
      () => new Response('Too Many Requests', { status: 429, headers: { 'Retry-After': '12' } }),
      () => jsonResponse(MACROS_COMPLETE),
      () => jsonResponse(FITNESS_PROFILE_PAYLOAD),
    ])

    const wrapper = await mountView()
    await flushPromises()

    const banner = wrapper.find('[data-testid="goals-rate-limit"]')
    expect(banner.exists()).toBe(true)
    expect(banner.text()).toContain('12')
  })

  it('shows an error banner in the macros section when /me/macros returns 5xx', async () => {
    mockFetchInOrder(fetchSpy, [
      () => jsonResponse(GOALS_PAYLOAD),
      () => new Response('Server Error', { status: 503 }),
      () => jsonResponse(FITNESS_PROFILE_PAYLOAD),
    ])

    const wrapper = await mountView()
    await flushPromises()

    const banner = wrapper.find('[data-testid="macros-error"]')
    expect(banner.exists()).toBe(true)
    expect(banner.text()).toMatch(/indisponible|impossible/i)
  })

  it('shows the macros rate-limit banner with retry-after on 429 from /me/macros', async () => {
    mockFetchInOrder(fetchSpy, [
      () => jsonResponse(GOALS_PAYLOAD),
      () => new Response('Too Many Requests', { status: 429, headers: { 'Retry-After': '18' } }),
      () => jsonResponse(FITNESS_PROFILE_PAYLOAD),
    ])

    const wrapper = await mountView()
    await flushPromises()

    const banner = wrapper.find('[data-testid="macros-rate-limit"]')
    expect(banner.exists()).toBe(true)
    expect(banner.text()).toContain('18')
  })

  it('toggling an allergy chip includes it in the PUT body', async () => {
    mockFetchInOrder(fetchSpy, [
      () => jsonResponse({ ...GOALS_PAYLOAD, allergies: [] }),
      () => jsonResponse(MACROS_COMPLETE),
      () => jsonResponse(FITNESS_PROFILE_PAYLOAD),
      () => jsonResponse({ ...GOALS_PAYLOAD, allergies: ['lactose'] }),
      () => jsonResponse(MACROS_COMPLETE),
    ])

    const wrapper = await mountView()
    await flushPromises()

    const lactoseChip = wrapper
      .findAll('[data-testid="goals-allergies"] button')
      .find((btn) => btn.text().toLowerCase().includes('lactose'))
    expect(lactoseChip).toBeDefined()
    await lactoseChip!.trigger('click')

    await wrapper.find('[data-testid="goals-form"]').trigger('submit.prevent')
    await flushPromises()

    const putCall = fetchSpy.mock.calls.find(
      (args: unknown[]) => args[0] === 'http://localhost:8001/api/v1/nutrition-goals/me'
        && (args[1] as RequestInit)?.method === 'PUT',
    )
    const body = JSON.parse((putCall![1] as RequestInit).body as string)
    expect(body.allergies).toContain('lactose')
  })
})
