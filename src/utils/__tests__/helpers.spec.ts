import { describe, it, expect } from 'vitest'
import {
  formatDate,
  formatDateShort,
  formatNumber,
  formatPercentage,
  translateEntityType,
  translateValidationStatus,
  translateAnomalyType,
  translateSeverity,
  timeAgo,
  isValidEmail,
} from '@/utils/helpers'

describe('Helper Functions', () => {
  describe('formatDate', () => {
    it('formats ISO date to readable format', () => {
      const isoDate = '2026-04-07T10:30:00Z'
      const formatted = formatDate(isoDate)
      
      expect(formatted).toContain('2026')
      expect(formatted).toContain('avril')
    })
  })

  describe('formatDateShort', () => {
    it('formats ISO date to short format', () => {
      const isoDate = '2026-04-07T10:30:00Z'
      const formatted = formatDateShort(isoDate)
      
      expect(formatted).toContain('07')
      expect(formatted).toContain('04')
      expect(formatted).toContain('2026')
    })
  })

  describe('formatNumber', () => {
    it('formats number with thousand separator', () => {
      expect(formatNumber(1000)).toContain('1')
      expect(formatNumber(1000000)).toContain('1')
    })

    it('handles zero correctly', () => {
      expect(formatNumber(0)).toBe('0')
    })
  })

  describe('formatPercentage', () => {
    it('formats percentage with default decimals', () => {
      const result = formatPercentage(95.678)
      expect(result).toContain('95.7')
      expect(result).toContain('%')
    })

    it('formats percentage with custom decimals', () => {
      const result = formatPercentage(95.678, 2)
      expect(result).toContain('95.68')
      expect(result).toContain('%')
    })
  })

  describe('translateEntityType', () => {
    it('translates user type', () => {
      expect(translateEntityType('user')).toBe('Utilisateur')
    })

    it('translates nutrition type', () => {
      expect(translateEntityType('nutrition')).toBe('Nutrition')
    })

    it('translates exercise type', () => {
      expect(translateEntityType('exercise')).toBe('Exercice')
    })

    it('translates biometric type', () => {
      expect(translateEntityType('biometric')).toBe('Biométrique')
    })

    it('returns original value for unknown type', () => {
      expect(translateEntityType('unknown')).toBe('unknown')
    })
  })

  describe('translateValidationStatus', () => {
    it('translates pending status', () => {
      expect(translateValidationStatus('pending')).toBe('En attente')
    })

    it('translates approved status', () => {
      expect(translateValidationStatus('approved')).toBe('Approuvé')
    })

    it('translates rejected status', () => {
      expect(translateValidationStatus('rejected')).toBe('Rejeté')
    })
  })

  describe('translateAnomalyType', () => {
    it('translates missing_value type', () => {
      expect(translateAnomalyType('missing_value')).toBe('Valeur manquante')
    })

    it('translates duplicate type', () => {
      expect(translateAnomalyType('duplicate')).toBe('Doublon')
    })

    it('translates outlier type', () => {
      expect(translateAnomalyType('outlier')).toBe('Valeur aberrante')
    })

    it('translates format_error type', () => {
      expect(translateAnomalyType('format_error')).toBe('Erreur de format')
    })
  })

  describe('translateSeverity', () => {
    it('translates low severity', () => {
      expect(translateSeverity('low')).toBe('Faible')
    })

    it('translates medium severity', () => {
      expect(translateSeverity('medium')).toBe('Moyen')
    })

    it('translates high severity', () => {
      expect(translateSeverity('high')).toBe('Élevé')
    })
  })

  describe('timeAgo', () => {
    it('returns "à l\'instant" for very recent dates', () => {
      const now = new Date().toISOString()
      expect(timeAgo(now)).toBe("à l'instant")
    })

    it('returns correct format for past dates', () => {
      const pastDate = new Date(Date.now() - 3600 * 1000).toISOString() // 1 hour ago
      const result = timeAgo(pastDate)
      expect(result).toContain('heure')
    })
  })

  describe('isValidEmail', () => {
    it('validates correct email', () => {
      expect(isValidEmail('test@example.com')).toBe(true)
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true)
    })

    it('invalidates incorrect email', () => {
      expect(isValidEmail('invalid')).toBe(false)
      expect(isValidEmail('test@')).toBe(false)
      expect(isValidEmail('@example.com')).toBe(false)
      expect(isValidEmail('test @example.com')).toBe(false)
    })
  })
})
