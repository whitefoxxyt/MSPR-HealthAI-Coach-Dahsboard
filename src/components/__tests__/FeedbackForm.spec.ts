import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import FeedbackForm from '../FeedbackForm.vue'

const EXERCISES = [
  { id: 1, name: 'Bench Press' },
  { id: 2, name: 'Squat' },
]

describe('FeedbackForm', () => {
  it('renders 5 rating buttons', () => {
    const wrapper = mount(FeedbackForm)

    const stars = wrapper.findAll('[data-testid^="feedback-rating-"]')
    expect(stars).toHaveLength(5)
  })

  it('renders a "completed" checkbox', () => {
    const wrapper = mount(FeedbackForm)

    expect(wrapper.find('[data-testid="feedback-completed"]').exists()).toBe(true)
  })

  it('renders a comment textarea', () => {
    const wrapper = mount(FeedbackForm)

    expect(wrapper.find('[data-testid="feedback-comment"]').exists()).toBe(true)
  })

  it('renders an exercise selector only when exercises are provided', () => {
    const without = mount(FeedbackForm)
    expect(without.find('[data-testid="feedback-exercise"]').exists()).toBe(false)

    const withExercises = mount(FeedbackForm, { props: { exercises: EXERCISES } })
    expect(withExercises.find('[data-testid="feedback-exercise"]').exists()).toBe(true)
  })

  it('submit button is disabled when rating is not selected', () => {
    const wrapper = mount(FeedbackForm)

    const submit = wrapper.find('[data-testid="feedback-submit"]')
    expect(submit.attributes('disabled')).toBeDefined()
  })

  it('clicking a rating star enables the submit button', async () => {
    const wrapper = mount(FeedbackForm)

    await wrapper.find('[data-testid="feedback-rating-4"]').trigger('click')

    const submit = wrapper.find('[data-testid="feedback-submit"]')
    expect(submit.attributes('disabled')).toBeUndefined()
  })

  it('emits "submit" with the body when the form is submitted', async () => {
    const wrapper = mount(FeedbackForm, { props: { exercises: EXERCISES } })

    await wrapper.find('[data-testid="feedback-rating-4"]').trigger('click')
    await wrapper.find('[data-testid="feedback-completed"]').setValue(true)
    await wrapper.find('[data-testid="feedback-comment"]').setValue('Top, varié et progressif.')
    await wrapper.find('[data-testid="feedback-exercise"]').setValue('2')

    await wrapper.find('[data-testid="feedback-submit"]').trigger('click')

    expect(wrapper.emitted('submit')).toBeDefined()
    expect(wrapper.emitted('submit')![0]).toEqual([
      {
        score: 4,
        completed: true,
        comment: 'Top, varié et progressif.',
        exercise_id: 2,
      },
    ])
  })

  it('emits "submit" with a null comment when the textarea is empty', async () => {
    const wrapper = mount(FeedbackForm)

    await wrapper.find('[data-testid="feedback-rating-5"]').trigger('click')

    await wrapper.find('[data-testid="feedback-submit"]').trigger('click')

    expect(wrapper.emitted('submit')![0]).toEqual([
      {
        score: 5,
        completed: false,
        comment: null,
        exercise_id: null,
      },
    ])
  })

  it('does not emit "submit" when no rating is selected', async () => {
    const wrapper = mount(FeedbackForm)

    await wrapper.find('[data-testid="feedback-submit"]').trigger('click')

    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('keeps the submit button disabled when comment exceeds 2000 chars (backend max)', async () => {
    const wrapper = mount(FeedbackForm)

    await wrapper.find('[data-testid="feedback-rating-3"]').trigger('click')
    expect(wrapper.find('[data-testid="feedback-submit"]').attributes('disabled')).toBeUndefined()

    await wrapper.find('[data-testid="feedback-comment"]').setValue('x'.repeat(2001))

    expect(wrapper.find('[data-testid="feedback-submit"]').attributes('disabled')).toBeDefined()
  })

  it('emits "cancel" when the cancel button is clicked', async () => {
    const wrapper = mount(FeedbackForm)

    await wrapper.find('[data-testid="feedback-cancel"]').trigger('click')

    expect(wrapper.emitted('cancel')).toBeDefined()
  })

  it('marks the submit button as loading when the loading prop is true', () => {
    const wrapper = mount(FeedbackForm, { props: { loading: true } })

    const submit = wrapper.find('[data-testid="feedback-submit"]')
    expect(submit.attributes('disabled')).toBeDefined()
    expect(submit.attributes('aria-busy')).toBe('true')
  })
})
