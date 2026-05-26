import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  formatNumber,
  formatPercentage,
  getSeverityClass,
  getStatusClass,
  getFlowStatusClass,
  downloadFile,
  exportData,
  timeAgo,
  copyToClipboard,
} from '@/utils/helpers'
import { exportApi } from '@/services/api'

describe('helpers — fonctions complémentaires', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('formatNumber + formatPercentage avec null/NaN', () => {
    it('formatNumber renvoie "—" pour null/undefined/NaN', () => {
      expect(formatNumber(null)).toBe('—')
      expect(formatNumber(undefined)).toBe('—')
      expect(formatNumber(NaN)).toBe('—')
    })

    it('formatPercentage renvoie "— %" pour null/undefined/NaN', () => {
      expect(formatPercentage(null)).toBe('— %')
      expect(formatPercentage(undefined)).toBe('— %')
      expect(formatPercentage(NaN)).toBe('— %')
    })
  })

  describe('getSeverityClass', () => {
    it.each([
      ['low', 'severity-low'],
      ['medium', 'severity-medium'],
      ['high', 'severity-high'],
    ])('renvoie la classe pour %s', (input, expected) => {
      expect(getSeverityClass(input)).toBe(expected)
    })

    it('renvoie une chaîne vide pour inconnu', () => {
      expect(getSeverityClass('zzz')).toBe('')
    })
  })

  describe('getStatusClass', () => {
    it.each([
      ['pending', 'status-pending'],
      ['approved', 'status-approved'],
      ['rejected', 'status-rejected'],
    ])('renvoie la classe pour %s', (input, expected) => {
      expect(getStatusClass(input)).toBe(expected)
    })

    it('renvoie une chaîne vide pour inconnu', () => {
      expect(getStatusClass('zzz')).toBe('')
    })
  })

  describe('getFlowStatusClass', () => {
    it.each([
      ['active', 'flow-active'],
      ['inactive', 'flow-inactive'],
      ['error', 'flow-error'],
    ])('renvoie la classe pour %s', (input, expected) => {
      expect(getFlowStatusClass(input)).toBe(expected)
    })

    it('renvoie une chaîne vide pour inconnu', () => {
      expect(getFlowStatusClass('zzz')).toBe('')
    })
  })

  describe('timeAgo (couvertures supplémentaires)', () => {
    it('jour singulier (1 jour)', () => {
      const date = new Date(Date.now() - 86400 * 1000).toISOString()
      expect(timeAgo(date)).toBe('il y a 1 jour')
    })

    it('jours pluriel (2 jours)', () => {
      const date = new Date(Date.now() - 2 * 86400 * 1000).toISOString()
      expect(timeAgo(date)).toBe('il y a 2 jours')
    })

    it('mois', () => {
      const date = new Date(Date.now() - 2592000 * 1000).toISOString()
      expect(timeAgo(date)).toContain('mois')
    })

    it('an', () => {
      const date = new Date(Date.now() - 31536000 * 1000).toISOString()
      expect(timeAgo(date)).toContain('an')
    })

    it('minute', () => {
      const date = new Date(Date.now() - 60 * 1000).toISOString()
      expect(timeAgo(date)).toContain('minute')
    })

    it('secondes', () => {
      const date = new Date(Date.now() - 30 * 1000).toISOString()
      expect(timeAgo(date)).toContain('seconde')
    })
  })

  describe('downloadFile', () => {
    beforeEach(() => {
      vi.stubGlobal('URL', {
        createObjectURL: vi.fn().mockReturnValue('blob:test'),
        revokeObjectURL: vi.fn(),
      })
    })
    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('crée un lien, déclenche click, et le retire', () => {
      const blob = new Blob(['hello'], { type: 'text/plain' })
      const clickSpy = vi.fn()
      const realCreate = document.createElement.bind(document)
      const createSpy = vi.spyOn(document, 'createElement').mockImplementation((tag) => {
        const el = realCreate(tag)
        if (tag === 'a') (el as HTMLAnchorElement).click = clickSpy
        return el
      })

      downloadFile(blob, 'fichier.csv')
      expect(createSpy).toHaveBeenCalledWith('a')
      expect(clickSpy).toHaveBeenCalled()
    })
  })

  describe('exportData', () => {
    beforeEach(() => {
      vi.stubGlobal('URL', {
        createObjectURL: vi.fn().mockReturnValue('blob:test'),
        revokeObjectURL: vi.fn(),
      })
    })
    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('appelle exportApi.exportData puis télécharge le fichier', async () => {
      const blob = new Blob(['x'], { type: 'application/json' })
      vi.spyOn(exportApi, 'exportData').mockResolvedValue(blob)
      const clickSpy = vi.fn()
      const realCreate = document.createElement.bind(document)
      vi.spyOn(document, 'createElement').mockImplementation((tag) => {
        const el = realCreate(tag)
        if (tag === 'a') (el as HTMLAnchorElement).click = clickSpy
        return el
      })

      await exportData({ format: 'json', includeMetadata: true })
      expect(clickSpy).toHaveBeenCalled()
    })

    it('lève une erreur si exportApi échoue', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.spyOn(exportApi, 'exportData').mockRejectedValue(new Error('500'))

      await expect(exportData({ format: 'csv', includeMetadata: false })).rejects.toThrow(/export/i)
      consoleSpy.mockRestore()
    })
  })

  describe('copyToClipboard', () => {
    it('utilise navigator.clipboard.writeText quand disponible', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined)
      vi.stubGlobal('navigator', { clipboard: { writeText } })

      await copyToClipboard('hello')
      expect(writeText).toHaveBeenCalledWith('hello')
      vi.unstubAllGlobals()
    })

    it('rejette si clipboard.writeText échoue', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.stubGlobal('navigator', {
        clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
      })

      await expect(copyToClipboard('x')).rejects.toThrow(/copie/i)
      consoleSpy.mockRestore()
      vi.unstubAllGlobals()
    })
  })
})
