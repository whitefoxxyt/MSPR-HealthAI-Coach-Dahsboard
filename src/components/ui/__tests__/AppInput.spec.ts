import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppInput from '../AppInput.vue'

describe('AppInput', () => {
  it('renders the label tied to the input via for/id', () => {
    const wrapper = mount(AppInput, { props: { label: 'Email', modelValue: '' } })
    const input = wrapper.find('input')
    const label = wrapper.find('label')
    expect(label.text()).toBe('Email')
    expect(label.attributes('for')).toBeTruthy()
    expect(input.attributes('id')).toBe(label.attributes('for'))
  })

  it('forwards modelValue to the input value', () => {
    const wrapper = mount(AppInput, { props: { label: 'Email', modelValue: 'hello@vital.app' } })
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('hello@vital.app')
  })

  it('emits update:modelValue on input', async () => {
    const wrapper = mount(AppInput, { props: { label: 'Email', modelValue: '' } })
    const input = wrapper.find('input')
    await input.setValue('hello')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['hello'])
  })

  it('honours the type prop (defaults to text)', () => {
    expect(
      mount(AppInput, { props: { label: 'Email', modelValue: '' } }).find('input').attributes('type'),
    ).toBe('text')
    expect(
      mount(AppInput, { props: { label: 'Email', modelValue: '', type: 'email' } }).find('input').attributes('type'),
    ).toBe('email')
  })

  it('renders an error message and marks the input invalid', () => {
    const wrapper = mount(AppInput, {
      props: { label: 'Email', modelValue: 'bad', error: 'Email invalide' },
    })
    expect(wrapper.find('[data-error]').text()).toBe('Email invalide')
    expect(wrapper.find('input').attributes('aria-invalid')).toBe('true')
  })

  it('renders a hint when provided', () => {
    const wrapper = mount(AppInput, {
      props: { label: 'Email', modelValue: '', hint: 'On ne partage jamais ton email.' },
    })
    expect(wrapper.find('[data-hint]').text()).toBe('On ne partage jamais ton email.')
  })

  it('forwards the placeholder', () => {
    const wrapper = mount(AppInput, {
      props: { label: 'Email', modelValue: '', placeholder: 'you@vital.app' },
    })
    expect(wrapper.find('input').attributes('placeholder')).toBe('you@vital.app')
  })
})
