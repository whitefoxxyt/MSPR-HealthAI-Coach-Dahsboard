import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import MealPlanView from '../MealPlanView.vue'

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

const SAMPLE_MEAL = {
  name: 'Porridge banane',
  macros: { calories: 420, protein_g: 18, carbs_g: 68, fat_g: 9, fiber_g: null },
  ingredients: ['flocons avoine', 'banane', 'lait'],
  budget_eur: 1.8,
  prep_time_min: 10,
}

const SAMPLE_PLAN = {
  days: [
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
  ],
  llm_backend_used: 'ollama',
  total_budget_eur: 18.5,
}

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/meal-plan', component: MealPlanView },
      { path: '/meal-plans', name: 'meal-plan-history', component: { template: '<div />' } },
      { path: '/profil', name: 'profile', component: { template: '<div />' } },
      { path: '/', component: { template: '<div />' } },
    ],
  })
}

async function mountView() {
  const router = createTestRouter()
  await router.push('/meal-plan')
  await router.isReady()
  return mount(MealPlanView, {
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

describe('MealPlanView', () => {
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

  describe('profile gating', () => {
    it('shows the EmptyState with a link to /profil when nutrition goals are missing', async () => {
      mockFetchInOrder(fetchSpy, [
        () => new Response('Not Found', { status: 404 }),
      ])

      const wrapper = await mountView()
      await flushPromises()

      const empty = wrapper.find('[data-testid="meal-plan-empty"]')
      expect(empty.exists()).toBe(true)
      expect(empty.text().toLowerCase()).toMatch(/profil/)
      const link = empty.find('a[href="/profil"]')
      expect(link.exists()).toBe(true)
    })

    it('does NOT show the form when nutrition goals are missing', async () => {
      mockFetchInOrder(fetchSpy, [
        () => new Response('Not Found', { status: 404 }),
      ])

      const wrapper = await mountView()
      await flushPromises()

      expect(wrapper.find('[data-testid="meal-plan-form"]').exists()).toBe(false)
    })

    it('shows the form when nutrition goals exist', async () => {
      mockFetchInOrder(fetchSpy, [() => jsonResponse(GOALS_PAYLOAD)])

      const wrapper = await mountView()
      await flushPromises()

      expect(wrapper.find('[data-testid="meal-plan-form"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="meal-plan-empty"]').exists()).toBe(false)
    })
  })

  describe('form', () => {
    it('pre-fills health_goal, diet_type and allergies from the nutrition goals', async () => {
      mockFetchInOrder(fetchSpy, [() => jsonResponse(GOALS_PAYLOAD)])

      const wrapper = await mountView()
      await flushPromises()

      const healthGoal = wrapper.find('[data-testid="form-health-goal"] select')
      expect((healthGoal.element as HTMLSelectElement).value).toBe('muscle_gain')

      const dietType = wrapper.find('[data-testid="form-diet-type"] select')
      expect((dietType.element as HTMLSelectElement).value).toBe('omnivore')

      const allergyChips = wrapper.findAll('[data-testid="form-allergies"] button[aria-pressed="true"]')
      expect(allergyChips.length).toBeGreaterThanOrEqual(1)
      expect(allergyChips.some((c) => c.text().toLowerCase().includes('arachide'))).toBe(true)
    })

    it('has a duration input defaulting between 1 and 30', async () => {
      mockFetchInOrder(fetchSpy, [() => jsonResponse(GOALS_PAYLOAD)])

      const wrapper = await mountView()
      await flushPromises()

      const duration = wrapper.find('[data-testid="form-duration"] input')
      expect(duration.exists()).toBe(true)
      const value = Number((duration.element as HTMLInputElement).value)
      expect(value).toBeGreaterThanOrEqual(1)
      expect(value).toBeLessThanOrEqual(30)
    })

    it('has an optional budget input', async () => {
      mockFetchInOrder(fetchSpy, [() => jsonResponse(GOALS_PAYLOAD)])

      const wrapper = await mountView()
      await flushPromises()

      expect(wrapper.find('[data-testid="form-budget"] input').exists()).toBe(true)
    })

    it('refuses submission when duration is below 1', async () => {
      mockFetchInOrder(fetchSpy, [() => jsonResponse(GOALS_PAYLOAD)])

      const wrapper = await mountView()
      await flushPromises()
      fetchSpy.mockClear()

      await wrapper.find('[data-testid="form-duration"] input').setValue('0')
      await wrapper.find('[data-testid="meal-plan-form"]').trigger('submit.prevent')
      await flushPromises()

      const generateCall = fetchSpy.mock.calls.find(
        (args: unknown[]) => args[0] === 'http://localhost:8001/api/v1/generate-meal-plan',
      )
      expect(generateCall).toBeUndefined()
      expect(wrapper.find('[data-testid="form-duration"]').text().toLowerCase()).toMatch(/entre 1 et 30/)
    })

    it('refuses submission when duration is above 30', async () => {
      mockFetchInOrder(fetchSpy, [() => jsonResponse(GOALS_PAYLOAD)])

      const wrapper = await mountView()
      await flushPromises()
      fetchSpy.mockClear()

      await wrapper.find('[data-testid="form-duration"] input').setValue('31')
      await wrapper.find('[data-testid="meal-plan-form"]').trigger('submit.prevent')
      await flushPromises()

      const generateCall = fetchSpy.mock.calls.find(
        (args: unknown[]) => args[0] === 'http://localhost:8001/api/v1/generate-meal-plan',
      )
      expect(generateCall).toBeUndefined()
      expect(wrapper.find('[data-testid="form-duration"]').text().toLowerCase()).toMatch(/entre 1 et 30/)
    })

    it('refuses submission when budget is 0 or negative', async () => {
      mockFetchInOrder(fetchSpy, [() => jsonResponse(GOALS_PAYLOAD)])

      const wrapper = await mountView()
      await flushPromises()
      fetchSpy.mockClear()

      await wrapper.find('[data-testid="form-budget"] input').setValue('-3')
      await wrapper.find('[data-testid="meal-plan-form"]').trigger('submit.prevent')
      await flushPromises()

      const generateCall = fetchSpy.mock.calls.find(
        (args: unknown[]) => args[0] === 'http://localhost:8001/api/v1/generate-meal-plan',
      )
      expect(generateCall).toBeUndefined()
      expect(wrapper.find('[data-testid="form-budget"]').text().toLowerCase()).toMatch(/sup[ée]rieur/)
    })

    it('submits the form with the right body when all fields are valid', async () => {
      mockFetchInOrder(fetchSpy, [
        () => jsonResponse(GOALS_PAYLOAD),
        () => jsonResponse(SAMPLE_PLAN),
      ])

      const wrapper = await mountView()
      await flushPromises()

      await wrapper.find('[data-testid="form-duration"] input').setValue('5')
      await wrapper.find('[data-testid="form-budget"] input').setValue('12')
      await wrapper.find('[data-testid="meal-plan-form"]').trigger('submit.prevent')
      await flushPromises()

      const generateCall = fetchSpy.mock.calls.find(
        (args: unknown[]) => args[0] === 'http://localhost:8001/api/v1/generate-meal-plan',
      )
      expect(generateCall).toBeDefined()
      const body = JSON.parse((generateCall![1] as RequestInit).body as string)
      expect(body.diet_type).toBe('omnivore')
      expect(body.duration_days).toBe(5)
      expect(body.health_goal).toBe('muscle_gain')
      expect(body.allergies).toContain('arachides')
      expect(body.budget_eur_per_day).toBe(12)
    })

    it('omits budget_eur_per_day from the body when left empty', async () => {
      mockFetchInOrder(fetchSpy, [
        () => jsonResponse(GOALS_PAYLOAD),
        () => jsonResponse(SAMPLE_PLAN),
      ])

      const wrapper = await mountView()
      await flushPromises()

      await wrapper.find('[data-testid="form-budget"] input').setValue('')
      await wrapper.find('[data-testid="meal-plan-form"]').trigger('submit.prevent')
      await flushPromises()

      const generateCall = fetchSpy.mock.calls.find(
        (args: unknown[]) => args[0] === 'http://localhost:8001/api/v1/generate-meal-plan',
      )
      const body = JSON.parse((generateCall![1] as RequestInit).body as string)
      expect(body).not.toHaveProperty('budget_eur_per_day')
    })
  })

  describe('loading and result', () => {
    it('shows a loading skeleton with the expected message while generating', async () => {
      let resolveGen!: (value: Response) => void
      const genPromise = new Promise<Response>((resolve) => {
        resolveGen = resolve
      })
      mockFetchInOrder(fetchSpy, [
        () => jsonResponse(GOALS_PAYLOAD),
      ])
      fetchSpy.mockImplementationOnce(() => Promise.resolve(jsonResponse(GOALS_PAYLOAD)))
      fetchSpy.mockImplementationOnce(() => genPromise)

      const wrapper = await mountView()
      await flushPromises()

      await wrapper.find('[data-testid="meal-plan-form"]').trigger('submit.prevent')
      await flushPromises()

      const loading = wrapper.find('[data-testid="meal-plan-loading"]')
      expect(loading.exists()).toBe(true)
      expect(loading.text().toLowerCase()).toMatch(/g[ée]n[ée]ration en cours/)
      expect(loading.text().toLowerCase()).toMatch(/quelques minutes/)

      resolveGen(jsonResponse(SAMPLE_PLAN))
      await flushPromises()
    })

    it('renders MealCalendar with the days, llm_backend_used and total budget on success', async () => {
      mockFetchInOrder(fetchSpy, [
        () => jsonResponse(GOALS_PAYLOAD),
        () => jsonResponse(SAMPLE_PLAN),
      ])

      const wrapper = await mountView()
      await flushPromises()

      await wrapper.find('[data-testid="meal-plan-form"]').trigger('submit.prevent')
      await flushPromises()

      const result = wrapper.find('[data-testid="meal-plan-result"]')
      expect(result.exists()).toBe(true)
      expect(wrapper.findAll('[data-testid="meal-day"]')).toHaveLength(2)

      const footer = wrapper.find('[data-testid="meal-plan-footer"]')
      expect(footer.text()).toContain('ollama')
      expect(footer.text()).toContain('18.5')
    })

    it('clicking "Nouveau plan" returns to the form step', async () => {
      mockFetchInOrder(fetchSpy, [
        () => jsonResponse(GOALS_PAYLOAD),
        () => jsonResponse(SAMPLE_PLAN),
      ])

      const wrapper = await mountView()
      await flushPromises()
      await wrapper.find('[data-testid="meal-plan-form"]').trigger('submit.prevent')
      await flushPromises()

      const reset = wrapper.find('[data-testid="meal-plan-reset"]')
      expect(reset.exists()).toBe(true)
      await reset.trigger('click')

      expect(wrapper.find('[data-testid="meal-plan-form"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="meal-plan-result"]').exists()).toBe(false)
    })

    it('renders an active "Historique" link to /meal-plans on the result step', async () => {
      mockFetchInOrder(fetchSpy, [
        () => jsonResponse(GOALS_PAYLOAD),
        () => jsonResponse(SAMPLE_PLAN),
      ])

      const wrapper = await mountView()
      await flushPromises()
      await wrapper.find('[data-testid="meal-plan-form"]').trigger('submit.prevent')
      await flushPromises()

      const link = wrapper.find('a[data-testid="meal-plan-history-link"]')
      expect(link.exists()).toBe(true)
      expect(link.text().toLowerCase()).toContain('historique')
      expect(link.attributes('href')).toBe('/meal-plans')
    })
  })

  describe('rate-limit handling', () => {
    it('shows the RateLimitBanner with retry-after when the API returns 429', async () => {
      mockFetchInOrder(fetchSpy, [
        () => jsonResponse(GOALS_PAYLOAD),
        () => new Response('Too Many Requests', {
          status: 429,
          headers: { 'Retry-After': '42' },
        }),
      ])

      const wrapper = await mountView()
      await flushPromises()
      await wrapper.find('[data-testid="meal-plan-form"]').trigger('submit.prevent')
      await flushPromises()

      const banner = wrapper.find('[data-testid="meal-plan-rate-limit"]')
      expect(banner.exists()).toBe(true)
      expect(banner.text()).toContain('42')
    })
  })
})
