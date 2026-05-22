import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppSelect from '../AppSelect.vue'

const options = [
  { value: 'mistral', label: 'Mistral (cloud)' },
  { value: 'ollama', label: 'Ollama (local)' },
]

describe('AppSelect', () => {
  it('renders the label tied to the select via for/id', () => {
    const wrapper = mount(AppSelect, {
      props: { label: 'Backend LLM', modelValue: 'mistral', options },
    })
    const select = wrapper.find('select')
    const label = wrapper.find('label')
    expect(label.text()).toBe('Backend LLM')
    expect(select.attributes('id')).toBe(label.attributes('for'))
  })

  it('renders one option per item with the right label/value', () => {
    const wrapper = mount(AppSelect, {
      props: { label: 'Backend', modelValue: 'mistral', options },
    })
    const items = wrapper.findAll('option')
    expect(items.map(o => o.attributes('value'))).toEqual(['mistral', 'ollama'])
    expect(items.map(o => o.text())).toEqual(['Mistral (cloud)', 'Ollama (local)'])
  })

  it('forwards modelValue to the select', () => {
    const wrapper = mount(AppSelect, {
      props: { label: 'Backend', modelValue: 'ollama', options },
    })
    expect((wrapper.find('select').element as HTMLSelectElement).value).toBe('ollama')
  })

  it('emits update:modelValue on change', async () => {
    const wrapper = mount(AppSelect, {
      props: { label: 'Backend', modelValue: 'mistral', options },
    })
    await wrapper.find('select').setValue('ollama')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['ollama'])
  })

  it('marks invalid and renders error when error prop is set', () => {
    const wrapper = mount(AppSelect, {
      props: { label: 'Backend', modelValue: 'mistral', options, error: 'Champ requis' },
    })
    expect(wrapper.find('select').attributes('aria-invalid')).toBe('true')
    expect(wrapper.find('[data-error]').text()).toBe('Champ requis')
  })
})
