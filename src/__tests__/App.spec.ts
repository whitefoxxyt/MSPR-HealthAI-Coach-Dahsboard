import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import App from '../App.vue'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: { template: '<div>Home</div>' } },
  ],
})

describe('App', () => {
  it('mounts and renders navigation', async () => {
    const wrapper = mount(App, {
      global: {
        plugins: [router],
      },
    })
    
    await router.isReady()
    
    expect(wrapper.text()).toContain('HealthAI Coach')
  })
})
