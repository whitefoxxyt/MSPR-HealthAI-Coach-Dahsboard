// Les noms ExerciseDB arrivent en anglais tout en minuscules, par exemple
// "cable one arm straight back high row (kneeling)". On les capitalise pour
// l'affichage sans traduire partiellement (un mélange anglais/français serait
// moins lisible que l'original, les GIFs illustrent déjà le mouvement).

const LOWERCASE_WORDS = new Set(['and', 'or', 'of', 'on', 'in', 'with', 'to', 'the', 'a'])

function capitalize(word: string): string {
  if (!word) return word
  return word.charAt(0).toUpperCase() + word.slice(1)
}

/** "barbell reverse grip incline bench row" -> "Barbell Reverse Grip Incline Bench Row" */
export function formatExerciseName(raw: string | null | undefined): string {
  if (!raw) return ''
  return raw
    .split(' ')
    .map((token, index) => {
      // Conserve la ponctuation autour du mot : "(kneeling)" -> "(Kneeling)".
      const match = token.match(/^(\W*)([\w-]+)(\W*)$/)
      if (!match) return token
      const prefix = match[1] ?? ''
      const word = match[2] ?? ''
      const suffix = match[3] ?? ''
      const lower = word.toLowerCase()
      if (index > 0 && !prefix && LOWERCASE_WORDS.has(lower)) {
        return `${prefix}${lower}${suffix}`
      }
      const capitalized = lower
        .split('-')
        .map((part) => capitalize(part))
        .join('-')
      return `${prefix}${capitalized}${suffix}`
    })
    .join(' ')
}
