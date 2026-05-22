import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import DashboardView from '../DashboardView.vue'
import LLMSelector from '@/components/LLMSelector.vue'

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

async function mountDashboard() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/admin', name: 'admin-dashboard', component: DashboardView },
      { path: '/admin/data-cleaning', name: 'admin-data-cleaning', component: { template: '<div/>' } },
      { path: '/admin/validation', name: 'admin-validation', component: { template: '<div/>' } },
    ],
  })
  await router.push('/admin')
  await router.isReady()

  return mount(DashboardView, {
    global: {
      plugins: [createPinia(), router],
      stubs: {
        DataQualitySection: true,
        UserProgressionSection: true,
        NutritionActivitySection: true,
        BusinessKpisSection: true,
        FontAwesomeIcon: true,
      },
    },
  })
}

describe('DashboardView', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    setActivePinia(createPinia())
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({}))
  })

  afterEach(() => {
    fetchSpy.mockRestore()
  })

  it("ne contient plus le LLMSelector (déplacé vers la vue /parametres)", async () => {
    const wrapper = await mountDashboard()
    await flushPromises()

    expect(wrapper.findComponent(LLMSelector).exists()).toBe(false)
    expect(wrapper.find('.llm-selector').exists()).toBe(false)
  })
})
