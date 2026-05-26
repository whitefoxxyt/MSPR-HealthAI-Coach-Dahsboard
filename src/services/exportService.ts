import type {
  DayPlan,
  Meal,
  MealAnalysisHistoryItem,
  MealAnalysisResult,
  MealPlanResponse,
  MealPlanSummary,
} from '@/services/aiNutritionApi'
import type {
  ExerciseInProgram,
  HealthGoalFitness,
  WorkoutProgram,
} from '@/services/recoFitnessApi'

export type AnalysisExportInput = MealAnalysisResult | MealAnalysisHistoryItem
export type PlanExportInput = MealPlanResponse | MealPlanSummary
export type ProgramExportInput = WorkoutProgram

const FITNESS_GOAL_LABELS: Record<HealthGoalFitness, string> = {
  fat_loss: 'Perte de gras',
  muscle_strength: 'Force musculaire',
  endurance: 'Endurance',
  general_health: 'Santé générale',
}

const HEALTH_GOAL_LABELS: Record<string, string> = {
  weight_loss: 'Perte de poids',
  muscle_gain: 'Prise de masse',
  balance: 'Équilibre',
  sport_performance: 'Performance sportive',
}

const DIET_TYPE_LABELS: Record<string, string> = {
  omnivore: 'Omnivore',
  vegetarien: 'Végétarien',
  vegan: 'Vegan',
  sans_gluten: 'Sans gluten',
}

const DATE_FORMATTER = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
})

const DATETIME_FORMATTER = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

function escapeHtml(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ''
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatDate(value: string | Date): string {
  const d = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(d.getTime())) return String(value)
  return DATE_FORMATTER.format(d)
}

function formatDateTime(value: string | Date): string {
  const d = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(d.getTime())) return String(value)
  return DATETIME_FORMATTER.format(d)
}

function timestampSlug(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
    `-${pad(date.getHours())}${pad(date.getMinutes())}`
  )
}

function triggerDownload(content: string, filename: string, mime: string): void {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

function analysisFilename(analysis: AnalysisExportInput, ext: 'json' | 'pdf'): string {
  const id = 'id' in analysis ? analysis.id : timestampSlug()
  return `analyse-repas-${id}.${ext}`
}

export function buildAnalysisJson(analysis: AnalysisExportInput): string {
  return JSON.stringify(analysis, null, 2)
}

export function exportAnalysisJson(analysis: AnalysisExportInput): void {
  triggerDownload(
    buildAnalysisJson(analysis),
    analysisFilename(analysis, 'json'),
    'application/json',
  )
}

const PRINT_STYLES = `
  @page { size: A4; margin: 18mm 14mm; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
  body {
    font-family: 'Helvetica', 'Arial', sans-serif;
    color: #141414;
    margin: 0;
    padding: 0;
    background: #ffffff;
  }
  .doc-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    border-bottom: 2px solid #141414;
    padding-bottom: 8mm;
    margin-bottom: 8mm;
  }
  .doc-brand {
    font-size: 22pt;
    font-weight: 700;
    letter-spacing: -0.01em;
  }
  .doc-export-date {
    font-size: 10pt;
    color: #555555;
  }
  .doc-section {
    margin-bottom: 8mm;
    page-break-inside: avoid;
  }
  .doc-section h2 {
    font-size: 12pt;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #555555;
    margin: 0 0 3mm 0;
  }
  .doc-section h3 {
    font-size: 13pt;
    margin: 0 0 2mm 0;
  }
  .doc-section p { margin: 0 0 2mm 0; font-size: 11pt; line-height: 1.4; }
  .doc-table { width: 100%; border-collapse: collapse; font-size: 10pt; }
  .doc-table th, .doc-table td {
    border: 1px solid #dddddd;
    padding: 2mm 3mm;
    text-align: left;
  }
  .doc-table th { background: #f4f4f4; font-weight: 600; }
  .doc-stats {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 3mm;
    margin: 0 0 4mm 0;
  }
  .doc-stat {
    border: 1px solid #dddddd;
    border-radius: 2mm;
    padding: 3mm;
    text-align: center;
  }
  .doc-stat-label {
    font-size: 8pt;
    letter-spacing: 0.1em;
    color: #777777;
    text-transform: uppercase;
  }
  .doc-stat-value {
    font-size: 16pt;
    font-weight: 700;
    margin-top: 1mm;
  }
  .doc-footer {
    position: fixed;
    bottom: 6mm;
    left: 0;
    right: 0;
    font-size: 8pt;
    text-align: center;
    color: #888888;
  }
  .doc-footer::after { content: counter(page) " / " counter(pages); margin-left: 2mm; }
`

function wrapHtmlDocument(
  title: string,
  exportedAt: Date,
  body: string,
  extraStyles = '',
): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>${PRINT_STYLES}${extraStyles}</style>
</head>
<body>
  <header class="doc-header">
    <div class="doc-brand">HealthAI Coach</div>
    <div class="doc-export-date">Exporté le ${escapeHtml(formatDateTime(exportedAt))}</div>
  </header>
  <main>${body}</main>
  <footer class="doc-footer">HealthAI Coach · Page </footer>
</body>
</html>`
}

const MEAL_TYPE_LABELS: Record<string, string> = {
  breakfast: 'Petit-déjeuner',
  lunch: 'Déjeuner',
  dinner: 'Dîner',
  snack: 'Encas',
}

function mealTypeLabel(value: string | null | undefined): string {
  if (!value) return '—'
  return MEAL_TYPE_LABELS[value] ?? value
}

function renderMacrosStats(macros: AnalysisExportInput['macros']): string {
  const fiber = macros.fiber_g ?? '—'
  return `
    <div class="doc-stats">
      <div class="doc-stat"><div class="doc-stat-label">Calories</div><div class="doc-stat-value">${escapeHtml(Math.round(macros.calories ?? 0))}</div></div>
      <div class="doc-stat"><div class="doc-stat-label">Protéines (g)</div><div class="doc-stat-value">${escapeHtml(macros.protein_g)}</div></div>
      <div class="doc-stat"><div class="doc-stat-label">Glucides (g)</div><div class="doc-stat-value">${escapeHtml(macros.carbs_g)}</div></div>
      <div class="doc-stat"><div class="doc-stat-label">Lipides (g)</div><div class="doc-stat-value">${escapeHtml(macros.fat_g)}</div></div>
      <div class="doc-stat"><div class="doc-stat-label">Fibres (g)</div><div class="doc-stat-value">${escapeHtml(fiber)}</div></div>
    </div>
  `
}

export function buildAnalysisPdfHtml(
  analysis: AnalysisExportInput,
  exportedAt: Date = new Date(),
): string {
  const createdAt = 'created_at' in analysis ? analysis.created_at : null
  const mealType = 'meal_type' in analysis ? analysis.meal_type ?? null : null

  const foodsRows = analysis.detected_foods
    .map(
      (f) =>
        `<tr><td>${escapeHtml(f.name)}</td><td>${escapeHtml(Math.round(f.confidence * 100))} %</td></tr>`,
    )
    .join('')

  const body = `
    <section class="doc-section">
      <h2>Analyse de repas</h2>
      ${createdAt ? `<p><strong>Date :</strong> ${escapeHtml(formatDate(createdAt))}</p>` : ''}
      <p><strong>Moment du repas :</strong> ${escapeHtml(mealTypeLabel(mealType))}</p>
      <p><strong>Moteur IA :</strong> ${escapeHtml(analysis.llm_backend_used)}</p>
    </section>

    <section class="doc-section">
      <h2>Macros estimées</h2>
      ${renderMacrosStats(analysis.macros)}
    </section>

    <section class="doc-section">
      <h2>Aliments détectés</h2>
      <table class="doc-table">
        <thead><tr><th>Aliment</th><th>Confiance</th></tr></thead>
        <tbody>${foodsRows}</tbody>
      </table>
    </section>

    <section class="doc-section">
      <h2>Conseil IA</h2>
      <p>${escapeHtml(analysis.insight)}</p>
    </section>
  `

  return wrapHtmlDocument('Analyse repas — HealthAI Coach', exportedAt, body)
}

function openPrintWindow(html: string, fallbackTitle: string): void {
  const win = window.open('', '_blank')
  if (!win) {
    window.alert(
      `Impossible d'ouvrir la fenêtre d'impression (${fallbackTitle}). Autorise les fenêtres pop-up pour ce site puis réessaye.`,
    )
    return
  }
  win.document.open()
  win.document.write(html)
  win.document.close()
  win.focus()
  win.print()
}

export function exportAnalysisPdf(analysis: AnalysisExportInput): void {
  const html = buildAnalysisPdfHtml(analysis)
  openPrintWindow(html, 'analyse repas')
}

function planFilename(plan: PlanExportInput, ext: 'json' | 'pdf'): string {
  const id = 'id' in plan ? plan.id : timestampSlug()
  return `plan-repas-${id}.${ext}`
}

const PLAN_SLOT_LABELS = ['Petit-déjeuner', 'Déjeuner', 'Dîner', 'Encas', 'Collation']

function planSlotLabel(index: number): string {
  return PLAN_SLOT_LABELS[index] ?? `Repas ${index + 1}`
}

function renderMeal(label: string, meal: Meal): string {
  const ingredients = meal.ingredients.map(escapeHtml).join(', ')
  const macros = meal.macros
  return `
    <div class="plan-meal">
      <div class="plan-meal-head">
        <span class="plan-meal-label">${escapeHtml(label)}</span>
        <span class="plan-meal-name">${escapeHtml(meal.name)}</span>
      </div>
      <div class="plan-meal-meta">
        <span>${escapeHtml(Math.round(macros.calories ?? 0))} kcal</span>
        <span>P ${escapeHtml(macros.protein_g)} g</span>
        <span>G ${escapeHtml(macros.carbs_g)} g</span>
        <span>L ${escapeHtml(macros.fat_g)} g</span>
        <span>${escapeHtml(meal.est_budget_eur)} €</span>
        <span>${escapeHtml(meal.prep_time_min)} min</span>
      </div>
      ${ingredients ? `<div class="plan-meal-ingredients">${ingredients}</div>` : ''}
    </div>
  `
}

function renderDay(day: DayPlan): string {
  const meals = day.meals.map((meal, idx) => renderMeal(planSlotLabel(idx), meal)).join('')
  return `
    <section class="doc-section plan-day">
      <h3>Jour ${escapeHtml(day.day)}</h3>
      ${meals}
    </section>
  `
}

const PLAN_EXTRA_STYLES = `
  .plan-meta {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 3mm;
    margin-bottom: 6mm;
  }
  .plan-meta-item { border: 1px solid #dddddd; padding: 3mm; border-radius: 2mm; }
  .plan-meta-label { font-size: 8pt; color: #777; text-transform: uppercase; letter-spacing: 0.08em; }
  .plan-meta-value { font-size: 12pt; font-weight: 600; margin-top: 1mm; }
  .plan-day { page-break-inside: avoid; }
  .plan-meal { border-left: 2pt solid #141414; padding: 2mm 0 2mm 3mm; margin-bottom: 4mm; }
  .plan-meal-head { display: flex; justify-content: space-between; align-items: baseline; }
  .plan-meal-label { font-size: 9pt; color: #777; text-transform: uppercase; letter-spacing: 0.08em; }
  .plan-meal-name { font-size: 12pt; font-weight: 600; }
  .plan-meal-meta { display: flex; flex-wrap: wrap; gap: 4mm; font-size: 9pt; color: #444; margin-top: 1mm; }
  .plan-meal-ingredients { font-size: 9pt; color: #555; margin-top: 1mm; font-style: italic; }
`

function planMetaBlock(plan: PlanExportInput): string {
  const created = 'created_at' in plan ? plan.created_at : null
  const goal = 'health_goal' in plan ? plan.health_goal : null
  const diet = 'diet_type' in plan ? plan.diet_type : null
  const duration = 'duration_days' in plan ? plan.duration_days : plan.days.length

  const items: string[] = []
  if (created) {
    items.push(
      `<div class="plan-meta-item"><div class="plan-meta-label">Généré le</div><div class="plan-meta-value">${escapeHtml(formatDate(created))}</div></div>`,
    )
  }
  if (goal) {
    items.push(
      `<div class="plan-meta-item"><div class="plan-meta-label">Objectif</div><div class="plan-meta-value">${escapeHtml(HEALTH_GOAL_LABELS[goal] ?? goal)}</div></div>`,
    )
  }
  if (diet) {
    items.push(
      `<div class="plan-meta-item"><div class="plan-meta-label">Régime</div><div class="plan-meta-value">${escapeHtml(DIET_TYPE_LABELS[diet] ?? diet)}</div></div>`,
    )
  }
  items.push(
    `<div class="plan-meta-item"><div class="plan-meta-label">Durée</div><div class="plan-meta-value">${escapeHtml(duration)} j</div></div>`,
    `<div class="plan-meta-item"><div class="plan-meta-label">Budget total</div><div class="plan-meta-value">${escapeHtml(plan.total_budget_eur)} €</div></div>`,
    `<div class="plan-meta-item"><div class="plan-meta-label">Moteur IA</div><div class="plan-meta-value">${escapeHtml(plan.llm_backend_used)}</div></div>`,
  )

  return `<div class="plan-meta">${items.join('')}</div>`
}

export function buildPlanJson(plan: PlanExportInput): string {
  return JSON.stringify(plan, null, 2)
}

export function buildPlanPdfHtml(
  plan: PlanExportInput,
  exportedAt: Date = new Date(),
): string {
  const days = plan.days.map(renderDay).join('')
  const body = `
    <section class="doc-section">
      <h2>Plan repas</h2>
      ${planMetaBlock(plan)}
    </section>
    ${days}
  `
  return wrapHtmlDocument('Plan repas — HealthAI Coach', exportedAt, body, PLAN_EXTRA_STYLES)
}

export function exportPlanJson(plan: PlanExportInput): void {
  triggerDownload(buildPlanJson(plan), planFilename(plan, 'json'), 'application/json')
}

export function exportPlanPdf(plan: PlanExportInput): void {
  openPrintWindow(buildPlanPdfHtml(plan), 'plan repas')
}

function programFilename(program: ProgramExportInput, ext: 'json' | 'pdf'): string {
  return `programme-fitness-${program.program_id}.${ext}`
}

function totalSessions(program: ProgramExportInput): number {
  return program.weeks.reduce((sum, week) => sum + week.length, 0)
}

function totalDurationMinutes(program: ProgramExportInput): number {
  return totalSessions(program) * (program.duration_min_per_session ?? 0)
}

const PROGRAM_EXTRA_STYLES = `
  .program-week { page-break-inside: avoid; margin-bottom: 6mm; }
  .program-week h3 { font-size: 12pt; margin: 0 0 3mm 0; border-bottom: 1px solid #dddddd; padding-bottom: 1mm; }
  .program-day { margin-bottom: 4mm; }
  .program-day h4 { font-size: 11pt; margin: 0 0 2mm 0; color: #444; }
  .exercise { display: grid; grid-template-columns: 1fr auto; gap: 3mm; padding: 2mm 3mm; border: 1px solid #eeeeee; border-radius: 1.5mm; margin-bottom: 1.5mm; }
  .exercise-name { font-weight: 600; font-size: 11pt; }
  .exercise-meta { font-size: 9pt; color: #555; margin-top: 1mm; }
  .exercise-meta span { margin-right: 3mm; }
  .exercise-badges { font-size: 9pt; color: #777; align-self: center; text-align: right; }
`

function renderExercise(ex: ExerciseInProgram, index: number): string {
  const muscles = ex.target_muscles.map(escapeHtml).join(', ')
  const equipment = ex.equipment.length > 0 ? ex.equipment.map(escapeHtml).join(', ') : '—'
  return `
    <div class="exercise">
      <div>
        <div class="exercise-name">${escapeHtml(index)}. ${escapeHtml(ex.name)}</div>
        <div class="exercise-meta">
          <span><strong>Cibles :</strong> ${muscles}</span>
          <span><strong>Équipement :</strong> ${equipment}</span>
        </div>
      </div>
      <div class="exercise-badges">${escapeHtml(ex.difficulty)}${ex.category ? ` · ${escapeHtml(ex.category)}` : ''}</div>
    </div>
  `
}

function programMetaBlock(program: ProgramExportInput): string {
  const totalMinutes = totalDurationMinutes(program)
  return `
    <div class="doc-stats">
      <div class="doc-stat"><div class="doc-stat-label">Objectif</div><div class="doc-stat-value">${escapeHtml(program.health_goal_at_generation ? (FITNESS_GOAL_LABELS[program.health_goal_at_generation] ?? program.health_goal_at_generation) : '-')}</div></div>
      <div class="doc-stat"><div class="doc-stat-label">Semaines</div><div class="doc-stat-value">${escapeHtml(program.duration_weeks)}</div></div>
      <div class="doc-stat"><div class="doc-stat-label">Séances</div><div class="doc-stat-value">${escapeHtml(totalSessions(program))}</div></div>
      <div class="doc-stat"><div class="doc-stat-label">Durée séance</div><div class="doc-stat-value">${escapeHtml(program.duration_min_per_session)} min</div></div>
      <div class="doc-stat"><div class="doc-stat-label">Total</div><div class="doc-stat-value">${escapeHtml(totalMinutes)} min</div></div>
    </div>
    <p><strong>Généré le :</strong> ${escapeHtml(formatDate(program.created_at))} · <strong>Stratégie :</strong> ${escapeHtml(program.scoring_strategy)} · <strong>Tier :</strong> ${escapeHtml(program.tier_at_generation)}</p>
    <p><strong>ID :</strong> ${escapeHtml(program.program_id)}</p>
  `
}

export function buildProgramJson(program: ProgramExportInput): string {
  return JSON.stringify(program, null, 2)
}

export function buildProgramPdfHtml(
  program: ProgramExportInput,
  exportedAt: Date = new Date(),
): string {
  const weeks = program.weeks
    .map((week, wi) => {
      const days = week
        .map((session, si) => {
          const exercises = session.map((ex, ei) => renderExercise(ex, ei + 1)).join('')
          return `<div class="program-day"><h4>Jour ${si + 1}</h4>${exercises}</div>`
        })
        .join('')
      return `<section class="program-week"><h3>Semaine ${wi + 1}</h3>${days}</section>`
    })
    .join('')

  const body = `
    <section class="doc-section">
      <h2>Programme fitness</h2>
      ${programMetaBlock(program)}
    </section>
    ${weeks}
  `
  return wrapHtmlDocument(
    'Programme fitness — HealthAI Coach',
    exportedAt,
    body,
    PROGRAM_EXTRA_STYLES,
  )
}

export function exportProgramJson(program: ProgramExportInput): void {
  triggerDownload(
    buildProgramJson(program),
    programFilename(program, 'json'),
    'application/json',
  )
}

export function exportProgramPdf(program: ProgramExportInput): void {
  openPrintWindow(buildProgramPdfHtml(program), 'programme fitness')
}
