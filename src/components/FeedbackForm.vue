<script setup lang="ts">
import { computed, ref } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import type { ProgramFeedbackBody } from '@/services/recoFitnessApi'

interface ExerciseOption {
  id: number
  name: string
}

const props = withDefaults(
  defineProps<{
    exercises?: ExerciseOption[]
    loading?: boolean
  }>(),
  {
    exercises: () => [],
    loading: false,
  },
)

const emit = defineEmits<{
  submit: [body: ProgramFeedbackBody]
  cancel: []
}>()

const COMMENT_MAX = 2000
const RATING_LABELS = ['Très déçu', 'Déçu', 'Correct', 'Bien', 'Excellent']

const rating = ref(0)
const completed = ref(false)
const comment = ref('')
const exerciseId = ref<string>('')

const commentTooLong = computed(() => comment.value.length > COMMENT_MAX)
const canSubmit = computed(
  () => rating.value >= 1 && rating.value <= 5 && !commentTooLong.value && !props.loading,
)

function selectRating(value: number) {
  rating.value = value
}

function onSubmit() {
  if (!canSubmit.value) return
  const trimmed = comment.value.trim()
  const parsedExerciseId = exerciseId.value === '' ? null : Number.parseInt(exerciseId.value, 10)
  emit('submit', {
    score: rating.value,
    completed: completed.value,
    comment: trimmed.length === 0 ? null : trimmed,
    exercise_id: Number.isFinite(parsedExerciseId) ? (parsedExerciseId as number) : null,
  })
}

function onCancel() {
  emit('cancel')
}
</script>

<template>
  <form class="feedback-form" novalidate @submit.prevent="onSubmit">
    <fieldset class="feedback-form__field">
      <legend class="feedback-form__label">Note</legend>
      <div class="rating" role="radiogroup" aria-label="Note du programme">
        <button
          v-for="value in 5"
          :key="value"
          type="button"
          :data-testid="`feedback-rating-${value}`"
          :class="['rating__star', { 'rating__star--filled': value <= rating }]"
          role="radio"
          :aria-checked="rating === value"
          :aria-label="`${value} sur 5 — ${RATING_LABELS[value - 1]}`"
          @click="selectRating(value)"
        >
          <span aria-hidden="true">★</span>
        </button>
      </div>
      <p v-if="rating > 0" class="feedback-form__hint">
        {{ rating }} / 5 — {{ RATING_LABELS[rating - 1] }}
      </p>
    </fieldset>

    <label class="feedback-form__checkbox">
      <input
        v-model="completed"
        data-testid="feedback-completed"
        type="checkbox"
      />
      <span>J'ai terminé ce programme</span>
    </label>

    <label class="feedback-form__field">
      <span class="feedback-form__label">Commentaire <span class="feedback-form__optional">(optionnel)</span></span>
      <textarea
        v-model="comment"
        data-testid="feedback-comment"
        class="feedback-form__textarea"
        rows="4"
        :maxlength="COMMENT_MAX + 1"
        placeholder="Qu'as-tu pensé du programme ?"
      />
      <span
        v-if="commentTooLong"
        class="feedback-form__error"
        role="alert"
      >
        Le commentaire ne peut pas dépasser {{ COMMENT_MAX }} caractères.
      </span>
    </label>

    <label v-if="exercises.length > 0" class="feedback-form__field">
      <span class="feedback-form__label">Exercice <span class="feedback-form__optional">(optionnel)</span></span>
      <select
        v-model="exerciseId"
        data-testid="feedback-exercise"
        class="feedback-form__select"
      >
        <option value="">— Programme entier —</option>
        <option v-for="ex in exercises" :key="ex.id" :value="String(ex.id)">
          {{ ex.name }}
        </option>
      </select>
    </label>

    <div class="feedback-form__actions">
      <AppButton
        type="button"
        variant="ghost"
        data-testid="feedback-cancel"
        @click="onCancel"
      >
        Annuler
      </AppButton>
      <AppButton
        type="submit"
        variant="acid"
        data-testid="feedback-submit"
        :disabled="!canSubmit"
        :loading="loading"
        @click="onSubmit"
      >
        Envoyer le feedback
      </AppButton>
    </div>
  </form>
</template>

<style scoped>
.feedback-form {
  display: flex;
  flex-direction: column;
  gap: var(--sp-md);
}

.feedback-form__field {
  display: flex;
  flex-direction: column;
  gap: var(--sp-xs);
  border: none;
  padding: 0;
  margin: 0;
}

.feedback-form__label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--c-onyx);
}

.feedback-form__optional {
  font-weight: 400;
  color: var(--c-gray-600);
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.feedback-form__hint {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--c-gray-600);
}

.feedback-form__textarea {
  resize: vertical;
  border: 1px solid var(--c-gray-200);
  border-radius: var(--r-md);
  padding: 0.7rem 0.9rem;
  font: inherit;
  font-size: 0.9375rem;
  color: var(--c-onyx);
  background: #ffffff;
}

.feedback-form__textarea:focus {
  outline: none;
  border-color: var(--c-onyx);
  box-shadow: 0 0 0 3px rgba(200, 255, 71, 0.45);
}

.feedback-form__select {
  appearance: none;
  border: 1px solid var(--c-gray-200);
  background: #ffffff;
  border-radius: var(--r-md);
  padding: 0.7rem 0.9rem;
  font: inherit;
  font-size: 0.9375rem;
  color: var(--c-onyx);
  min-height: 44px;
}

.feedback-form__select:focus {
  outline: none;
  border-color: var(--c-onyx);
  box-shadow: 0 0 0 3px rgba(200, 255, 71, 0.45);
}

.feedback-form__checkbox {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-sm);
  font-size: 0.9375rem;
  color: var(--c-onyx);
  cursor: pointer;
}

.feedback-form__checkbox input {
  width: 18px;
  height: 18px;
  accent-color: var(--c-acid-dark);
  cursor: pointer;
}

.feedback-form__error {
  font-size: 0.8125rem;
  color: var(--c-coral);
}

.feedback-form__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--sp-sm);
  padding-top: var(--sp-xs);
}

.rating {
  display: inline-flex;
  gap: 0.3rem;
}

.rating__star {
  background: transparent;
  border: 1px solid var(--c-gray-200);
  border-radius: var(--r-md);
  width: 44px;
  height: 44px;
  font-size: 1.4rem;
  line-height: 1;
  color: var(--c-gray-400);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background var(--d-standard) var(--ease-out-expo),
    color var(--d-standard) var(--ease-out-expo),
    border-color var(--d-standard) var(--ease-out-expo);
}

.rating__star:hover {
  border-color: var(--c-onyx);
  color: var(--c-onyx);
}

.rating__star:focus-visible {
  outline: 2px solid var(--c-acid-dark);
  outline-offset: 2px;
}

.rating__star--filled {
  background: var(--c-acid);
  border-color: var(--c-acid-dark);
  color: var(--c-onyx);
}
</style>
