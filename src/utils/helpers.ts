/**
 * Utilitaires pour le formatage et la conversion de données
 */

import type { ExportOptions, DataRecord } from '@/types'
import { exportApi } from '@/services/api'

/**
 * Formate une date ISO en format lisible
 */
export function formatDate(isoDate: string): string {
  const date = new Date(isoDate)
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

/**
 * Formate une date ISO en format court
 */
export function formatDateShort(isoDate: string): string {
  const date = new Date(isoDate)
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

/**
 * Formate un nombre avec séparateur de milliers
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('fr-FR').format(num)
}

/**
 * Formate un pourcentage
 */
export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)} %`
}

/**
 * Traduit un type d'entité en français
 */
export function translateEntityType(type: string): string {
  const translations: Record<string, string> = {
    user: 'Utilisateur',
    nutrition: 'Nutrition',
    exercise: 'Exercice',
    biometric: 'Biométrique',
  }
  return translations[type] || type
}

/**
 * Traduit un statut de validation en français
 */
export function translateValidationStatus(status: string): string {
  const translations: Record<string, string> = {
    pending: 'En attente',
    approved: 'Approuvé',
    rejected: 'Rejeté',
  }
  return translations[status] || status
}

/**
 * Traduit un type d'anomalie en français
 */
export function translateAnomalyType(type: string): string {
  const translations: Record<string, string> = {
    missing_value: 'Valeur manquante',
    duplicate: 'Doublon',
    outlier: 'Valeur aberrante',
    format_error: 'Erreur de format',
  }
  return translations[type] || type
}

/**
 * Traduit un niveau de sévérité en français
 */
export function translateSeverity(severity: string): string {
  const translations: Record<string, string> = {
    low: 'Faible',
    medium: 'Moyen',
    high: 'Élevé',
  }
  return translations[severity] || severity
}

/**
 * Retourne la classe CSS pour une sévérité
 */
export function getSeverityClass(severity: string): string {
  const classes: Record<string, string> = {
    low: 'severity-low',
    medium: 'severity-medium',
    high: 'severity-high',
  }
  return classes[severity] || ''
}

/**
 * Retourne la classe CSS pour un statut de validation
 */
export function getStatusClass(status: string): string {
  const classes: Record<string, string> = {
    pending: 'status-pending',
    approved: 'status-approved',
    rejected: 'status-rejected',
  }
  return classes[status] || ''
}

/**
 * Retourne la classe CSS pour un statut de flux
 */
export function getFlowStatusClass(status: string): string {
  const classes: Record<string, string> = {
    active: 'flow-active',
    inactive: 'flow-inactive',
    error: 'flow-error',
  }
  return classes[status] || ''
}

/**
 * Déclenche le téléchargement d'un fichier
 */
export function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Exporte des données au format spécifié
 */
export async function exportData(options: ExportOptions): Promise<void> {
  try {
    const blob = await exportApi.exportData(options)
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `healthai-export-${timestamp}.${options.format}`
    downloadFile(blob, filename)
  } catch (error) {
    console.error('Error exporting data:', error)
    throw new Error('Erreur lors de l\'export des données')
  }
}

/**
 * Calcule la durée relative (il y a X temps)
 */
export function timeAgo(isoDate: string): string {
  const date = new Date(isoDate)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  const intervals = [
    { label: 'an', seconds: 31536000 },
    { label: 'mois', seconds: 2592000 },
    { label: 'jour', seconds: 86400 },
    { label: 'heure', seconds: 3600 },
    { label: 'minute', seconds: 60 },
    { label: 'seconde', seconds: 1 },
  ]

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds)
    if (count >= 1) {
      return `il y a ${count} ${interval.label}${count > 1 ? 's' : ''}`
    }
  }

  return 'à l\'instant'
}

/**
 * Valide une adresse email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Copie du texte dans le presse-papiers
 */
export async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
  } catch (error) {
    console.error('Error copying to clipboard:', error)
    throw new Error('Erreur lors de la copie')
  }
}
