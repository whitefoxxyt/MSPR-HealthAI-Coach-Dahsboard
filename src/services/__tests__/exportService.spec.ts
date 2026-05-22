import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  buildAnalysisJson,
  buildAnalysisPdfHtml,
  buildPlanJson,
  buildPlanPdfHtml,
  buildProgramJson,
  buildProgramPdfHtml,
  exportAnalysisJson,
  exportAnalysisPdf,
  exportPlanJson,
  exportPlanPdf,
  exportProgramJson,
  exportProgramPdf,
} from '../exportService'
import type {
  MealAnalysisHistoryItem,
  MealPlanResponse,
  MealPlanSummary,
} from '../aiNutritionApi'
import type { WorkoutProgram } from '../recoFitnessApi'

interface DownloadCapture {
  url: string
  blob: Blob
  filename: string
  revoked: string[]
}

function captureDownload(): DownloadCapture {
  const state: DownloadCapture = {
    url: '',
    blob: new Blob(),
    filename: '',
    revoked: [],
  }
  const createObjectURL = vi.fn((blob: Blob) => {
    state.blob = blob
    state.url = `blob:mock/${state.filename || 'pending'}`
    return state.url
  })
  const revokeObjectURL = vi.fn((url: string) => {
    state.revoked.push(url)
  })
  vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL })

  const originalCreate = document.createElement.bind(document)
  vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    const el = originalCreate(tag) as HTMLElement
    if (tag === 'a') {
      const anchor = el as HTMLAnchorElement
      Object.defineProperty(anchor, 'download', {
        set(v: string) {
          state.filename = v
        },
        get() {
          return state.filename
        },
        configurable: true,
      })
    }
    return el
  })

  return state
}

async function readBlob(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsText(blob)
  })
}

const analysisFixture: MealAnalysisHistoryItem = {
  id: 'ana-123',
  created_at: '2026-05-22T10:00:00.000Z',
  meal_type: 'lunch',
  image_url: 'https://example.com/photo.jpg',
  detected_foods: [
    { name: 'Salade', confidence: 0.92 },
    { name: 'Poulet grillé', confidence: 0.88 },
  ],
  macros: {
    calories: 520,
    protein_g: 38,
    carbs_g: 42,
    fat_g: 18,
    fiber_g: 6,
  },
  insight: 'Repas équilibré, bonne source de protéines.',
  llm_backend_used: 'mistral',
}

const mealBase = {
  macros: { calories: 500, protein_g: 30, carbs_g: 50, fat_g: 18, fiber_g: 4 },
  ingredients: ['ingrédient'],
  budget_eur: 3.5,
  prep_time_min: 15,
}

const planResponseFixture: MealPlanResponse = {
  llm_backend_used: 'mistral',
  total_budget_eur: 42.5,
  days: [
    {
      day: 1,
      breakfast: { name: 'Porridge', ...mealBase },
      lunch: { name: 'Salade poulet', ...mealBase },
      dinner: { name: 'Saumon riz', ...mealBase },
    },
  ],
}

const programFixture: WorkoutProgram = {
  program_id: 'prog-77',
  user_id: 'user-1',
  duration_weeks: 1,
  scoring_strategy: 'hybrid_rank_fusion',
  tier_at_generation: 'premium',
  health_goal_at_generation: 'muscle_strength',
  duration_min_per_session: 45,
  created_at: '2026-05-21T08:00:00.000Z',
  weeks: [
    [
      [
        {
          id: 1,
          name: 'Squat barre',
          target_muscles: ['quadriceps', 'fessiers'],
          equipment: ['barre'],
          difficulty: 'intermediate',
          category: 'force',
        },
        {
          id: 2,
          name: 'Développé couché',
          target_muscles: ['pectoraux'],
          equipment: ['barre', 'banc'],
          difficulty: 'intermediate',
          category: 'force',
        },
      ],
    ],
  ],
}

const planSummaryFixture: MealPlanSummary = {
  id: 'plan-42',
  created_at: '2026-05-20T09:00:00.000Z',
  health_goal: 'weight_loss',
  diet_type: 'omnivore',
  duration_days: 1,
  total_budget_eur: 42.5,
  llm_backend_used: 'mistral',
  days: planResponseFixture.days,
}

describe('buildAnalysisJson', () => {
  it('produit un JSON valide contenant les champs de l’analyse', () => {
    const json = buildAnalysisJson(analysisFixture)

    const parsed = JSON.parse(json)
    expect(parsed).toMatchObject({
      id: 'ana-123',
      detected_foods: [
        { name: 'Salade', confidence: 0.92 },
        { name: 'Poulet grillé', confidence: 0.88 },
      ],
      macros: { calories: 520, protein_g: 38 },
      insight: 'Repas équilibré, bonne source de protéines.',
    })
  })
})

describe('buildAnalysisPdfHtml', () => {
  it('inclut l’en-tête HealthAI Coach, la date d’export et le contenu de l’analyse', () => {
    const html = buildAnalysisPdfHtml(analysisFixture, new Date('2026-05-22T08:30:00Z'))

    expect(html).toContain('HealthAI Coach')
    expect(html).toContain('Salade')
    expect(html).toContain('Poulet grillé')
    expect(html).toContain('520')
    expect(html).toContain('Repas équilibré, bonne source de protéines.')
    expect(html).toMatch(/22\s*\/\s*05\s*\/\s*2026|22\s+mai\s+2026/i)
    expect(html).toMatch(/@page|@media\s+print/i)
  })
})

describe('exportAnalysisPdf', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('ouvre une fenêtre avec le HTML d’impression et déclenche window.print', () => {
    const printSpy = vi.fn()
    const closeSpy = vi.fn()
    let writtenHtml = ''
    const fakeWindow = {
      document: {
        open: vi.fn(),
        write: vi.fn((html: string) => {
          writtenHtml += html
        }),
        close: vi.fn(),
      },
      focus: vi.fn(),
      print: printSpy,
      close: closeSpy,
      onafterprint: null as null | (() => void),
    }
    const openSpy = vi.fn(() => fakeWindow as unknown as Window)
    vi.stubGlobal('open', openSpy)

    exportAnalysisPdf(analysisFixture)

    expect(openSpy).toHaveBeenCalled()
    expect(writtenHtml).toContain('HealthAI Coach')
    expect(writtenHtml).toContain('Salade')
    expect(printSpy).toHaveBeenCalled()
  })
})

describe('buildPlanJson', () => {
  it('produit un JSON parseable contenant les jours et le budget total', () => {
    const json = buildPlanJson(planSummaryFixture)
    const parsed = JSON.parse(json)
    expect(parsed.total_budget_eur).toBe(42.5)
    expect(parsed.days[0].breakfast.name).toBe('Porridge')
  })
})

describe('buildPlanPdfHtml', () => {
  it('inclut le titre HealthAI Coach et les repas de chaque jour', () => {
    const html = buildPlanPdfHtml(planSummaryFixture, new Date('2026-05-22T08:30:00Z'))
    expect(html).toContain('HealthAI Coach')
    expect(html).toContain('Plan repas')
    expect(html).toContain('Porridge')
    expect(html).toContain('Salade poulet')
    expect(html).toContain('Saumon riz')
    expect(html).toContain('42.5')
  })
})

describe('exportPlanJson', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('déclenche le téléchargement du plan en JSON', async () => {
    const capture = captureDownload()
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    exportPlanJson(planSummaryFixture)

    const text = await readBlob(capture.blob)
    const parsed = JSON.parse(text)
    expect(parsed.id).toBe('plan-42')
    expect(capture.filename).toMatch(/\.json$/)
  })
})

describe('exportPlanPdf', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('ouvre une fenêtre d’impression avec le plan repas', () => {
    let writtenHtml = ''
    const printSpy = vi.fn()
    const fakeWindow = {
      document: {
        open: vi.fn(),
        write: vi.fn((html: string) => {
          writtenHtml += html
        }),
        close: vi.fn(),
      },
      focus: vi.fn(),
      print: printSpy,
    }
    vi.stubGlobal('open', vi.fn(() => fakeWindow as unknown as Window))

    exportPlanPdf(planResponseFixture)

    expect(writtenHtml).toContain('Porridge')
    expect(printSpy).toHaveBeenCalled()
  })
})

describe('buildProgramJson', () => {
  it('produit un JSON parseable contenant le program_id et les exercices', () => {
    const json = buildProgramJson(programFixture)
    const parsed = JSON.parse(json)
    expect(parsed.program_id).toBe('prog-77')
    expect(parsed.weeks[0][0][0].name).toBe('Squat barre')
  })
})

describe('buildProgramPdfHtml', () => {
  it('inclut l’en-tête HealthAI Coach, les statistiques et les exercices', () => {
    const html = buildProgramPdfHtml(programFixture, new Date('2026-05-22T08:30:00Z'))
    expect(html).toContain('HealthAI Coach')
    expect(html).toContain('Programme fitness')
    expect(html).toContain('Squat barre')
    expect(html).toContain('Développé couché')
    expect(html).toContain('quadriceps')
    expect(html).toContain('Semaine 1')
    expect(html).toContain('Jour 1')
  })
})

describe('exportProgramJson', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('déclenche le téléchargement du programme en JSON', async () => {
    const capture = captureDownload()
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    exportProgramJson(programFixture)

    const text = await readBlob(capture.blob)
    const parsed = JSON.parse(text)
    expect(parsed.program_id).toBe('prog-77')
    expect(capture.filename).toContain('prog-77')
    expect(capture.filename).toMatch(/\.json$/)
  })
})

describe('exportProgramPdf', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('ouvre une fenêtre d’impression avec le programme', () => {
    let writtenHtml = ''
    const printSpy = vi.fn()
    const fakeWindow = {
      document: {
        open: vi.fn(),
        write: vi.fn((html: string) => {
          writtenHtml += html
        }),
        close: vi.fn(),
      },
      focus: vi.fn(),
      print: printSpy,
    }
    vi.stubGlobal('open', vi.fn(() => fakeWindow as unknown as Window))

    exportProgramPdf(programFixture)

    expect(writtenHtml).toContain('Squat barre')
    expect(printSpy).toHaveBeenCalled()
  })
})

describe('exportAnalysisJson', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('déclenche le téléchargement d’un Blob JSON parseable', async () => {
    const capture = captureDownload()
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    exportAnalysisJson(analysisFixture)

    expect(clickSpy).toHaveBeenCalledOnce()
    expect(capture.blob.type).toBe('application/json')
    const text = await readBlob(capture.blob)
    expect(JSON.parse(text)).toMatchObject({ id: 'ana-123' })
    expect(capture.filename).toMatch(/\.json$/)
    expect(capture.revoked).toContain(capture.url)
  })
})
