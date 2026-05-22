import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import RateLimitBanner from '../RateLimitBanner.vue'

describe('RateLimitBanner', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders nothing when retryAfter is 0', () => {
    const wrapper = mount(RateLimitBanner, { props: { retryAfter: 0 } })
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
  })

  it('displays the remaining seconds when retryAfter > 0', () => {
    const wrapper = mount(RateLimitBanner, { props: { retryAfter: 12 } })
    expect(wrapper.find('[role="status"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('12')
  })

  it('counts the seconds down to zero', async () => {
    const wrapper = mount(RateLimitBanner, { props: { retryAfter: 3 } })
    expect(wrapper.text()).toContain('3')
    vi.advanceTimersByTime(1000)
    await flushPromises()
    expect(wrapper.text()).toContain('2')
    vi.advanceTimersByTime(2000)
    await flushPromises()
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
  })

  it('emits dismiss when the close button is clicked', async () => {
    const wrapper = mount(RateLimitBanner, { props: { retryAfter: 10 } })
    await wrapper.find('[data-dismiss]').trigger('click')
    expect(wrapper.emitted('dismiss')).toHaveLength(1)
  })
})
