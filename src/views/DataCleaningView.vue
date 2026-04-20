<template>
  <div class="data-cleaning">
    <header class="page-header">
      <h1 class="page-title">
        <font-awesome-icon :icon="['fas', 'broom']" class="title-icon" />
        Nettoyage des données
      </h1>
      <p class="page-subtitle">
        Correction et normalisation des anomalies détectées
      </p>
    </header>

    <!-- Message d'erreur -->
    <div v-if="error" class="alert alert-error" role="alert">
      <font-awesome-icon :icon="['fas', 'triangle-exclamation']" />
      {{ error }}
    </div>

    <!-- Message de succès -->
    <div v-if="successMessage" class="alert alert-success" role="alert">
      <font-awesome-icon :icon="['fas', 'circle-check']" />
      {{ successMessage }}
    </div>

    <!-- Barre d'actions -->
    <section class="action-bar">
      <div class="action-bar__left">
        <button 
          class="btn btn-primary" 
          @click="refreshData"
          :disabled="loading"
        >
          <font-awesome-icon :icon="['fas', 'rotate']" :spin="loading" />
          Actualiser
        </button>
        
        <label for="severity-filter" class="sr-only">Filtrer par sévérité</label>
        <select
          id="severity-filter"
          v-model="severityFilter"
          class="filter-select"
          @change="handleFilterChange"
        >
          <option value="all">Toutes les sévérités</option>
          <option value="high">Élevée</option>
          <option value="medium">Moyenne</option>
          <option value="low">Faible</option>
        </select>

        <label for="type-filter" class="sr-only">Filtrer par type d'anomalie</label>
        <select
          id="type-filter"
          v-model="typeFilter"
          class="filter-select"
          @change="handleFilterChange"
        >
          <option value="all">Tous les types</option>
          <option value="missing_value">Valeur manquante</option>
          <option value="duplicate">Doublon</option>
          <option value="outlier">Valeur aberrante</option>
          <option value="format_error">Erreur de format</option>
        </select>
      </div>

      <div class="action-bar__right">
        <span class="anomaly-count">
          <font-awesome-icon :icon="['fas', 'list']" />
          {{ totalAnomalies }} anomalie(s)
        </span>

        <div class="action-control">
          <label for="export-format" class="sr-only">Format d'export</label>
          <select id="export-format" v-model="exportFormat" class="filter-select filter-select--compact">
            <option value="csv">CSV</option>
            <option value="json">JSON</option>
          </select>
          <button class="btn btn-secondary" @click="handleExportData">
            Exporter
          </button>
        </div>

        <div class="action-control">
          <label for="import-format" class="sr-only">Format d'import</label>
          <select id="import-format" v-model="importFormat" class="filter-select filter-select--compact">
            <option value="csv">CSV</option>
            <option value="json">JSON</option>
          </select>
          <button class="btn btn-secondary" @click="openImportDialog">
            Importer
          </button>
          <input
            ref="importFileInput"
            class="file-input-hidden"
            type="file"
            :accept="importAccept"
            @change="handleImportFileChange"
          />
        </div>
      </div>
    </section>

    <!-- Loading spinner -->
    <div v-if="loading && anomalies.length === 0" class="loading-container">
      <font-awesome-icon :icon="['fas', 'spinner']" spin size="3x" class="loading-spinner" />
      <p>Chargement des anomalies...</p>
    </div>

    <!-- Table des anomalies -->
    <section v-else class="anomalies-section">
      <div v-if="anomalies.length === 0" class="empty-state">
        <font-awesome-icon :icon="['fas', 'check-circle']" size="3x" class="empty-state__icon" />
        <h2 class="empty-state__title">Aucune anomalie</h2>
        <p class="empty-state__text">
          Toutes les données sont propres. Excellent travail !
        </p>
      </div>

      <div v-else class="table-container">
        <table class="anomalies-table" role="table">
          <thead>
            <tr>
              <th scope="col">Type</th>
              <th scope="col">Entité</th>
              <th scope="col">Champ</th>
              <th scope="col">Valeur actuelle</th>
              <th scope="col">Valeur suggérée</th>
              <th scope="col">Sévérité</th>
              <th scope="col">Détecté le</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="anomaly in anomalies" 
              :key="anomaly.id"
              :class="{ 'row-editing': editingAnomaly?.id === anomaly.id }"
            >
              <td>
                <span class="anomaly-type">
                  <font-awesome-icon :icon="getAnomalyTypeIcon(anomaly.type)" />
                  {{ getAnomalyTypeLabel(anomaly.type) }}
                </span>
              </td>
              <td>
                <span class="entity-badge" :class="`entity-badge--${anomaly.entityType}`">
                  <font-awesome-icon :icon="getEntityIcon(anomaly.entityType)" />
                  {{ getEntityLabel(anomaly.entityType) }}
                </span>
              </td>
              <td>
                <code class="field-name">{{ anomaly.field }}</code>
              </td>
              <td>
                <span class="current-value">
                  {{ anomaly.currentValue || '-' }}
                </span>
              </td>
              <td>
                <input
                  v-if="editingAnomaly?.id === anomaly.id"
                  v-model="editedValue"
                  type="text"
                  class="input-inline"
                  :placeholder="anomaly.suggestedValue || 'Nouvelle valeur'"
                  :aria-label="`Nouvelle valeur pour ${anomaly.field}`"
                />
                <span v-else class="suggested-value">
                  {{ anomaly.suggestedValue || '-' }}
                </span>
              </td>
              <td>
                <span class="severity-badge" :class="`severity-badge--${anomaly.severity}`">
                  <font-awesome-icon :icon="getSeverityIcon(anomaly.severity)" />
                  {{ getSeverityLabel(anomaly.severity) }}
                </span>
              </td>
              <td>
                <time :datetime="anomaly.detectedAt">
                  {{ formatDate(anomaly.detectedAt) }}
                </time>
              </td>
              <td>
                <div class="action-buttons">
                  <template v-if="editingAnomaly?.id === anomaly.id">
                    <button
                      class="btn-icon btn-icon--success"
                      @click="saveEdit"
                      :disabled="loading"
                      :aria-label="`Enregistrer la modification de ${anomaly.field}`"
                      title="Enregistrer"
                    >
                      <font-awesome-icon :icon="['fas', 'check']" aria-hidden="true" />
                    </button>
                    <button
                      class="btn-icon btn-icon--secondary"
                      @click="cancelEdit"
                      :disabled="loading"
                      aria-label="Annuler la modification"
                      title="Annuler"
                    >
                      <font-awesome-icon :icon="['fas', 'xmark']" aria-hidden="true" />
                    </button>
                  </template>
                  <template v-else>
                    <button
                      class="btn-icon btn-icon--primary"
                      @click="startEdit(anomaly)"
                      :disabled="loading"
                      :aria-label="`Éditer la valeur de ${anomaly.field}`"
                      title="Éditer"
                    >
                      <font-awesome-icon :icon="['fas', 'pen']" aria-hidden="true" />
                    </button>
                    <button
                      class="btn-icon btn-icon--success"
                      @click="applyFix(anomaly)"
                      :disabled="loading || !anomaly.suggestedValue"
                      :aria-label="`Appliquer la correction suggérée pour ${anomaly.field}`"
                      title="Appliquer la correction"
                    >
                      <font-awesome-icon :icon="['fas', 'wand-magic-sparkles']" aria-hidden="true" />
                    </button>
                    <button
                      class="btn-icon btn-icon--danger"
                      @click="deleteAnomaly(anomaly.id)"
                      :disabled="loading"
                      :aria-label="`Supprimer l'anomalie de ${anomaly.field}`"
                      title="Supprimer"
                    >
                      <font-awesome-icon :icon="['fas', 'trash']" aria-hidden="true" />
                    </button>
                  </template>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <nav v-if="totalPages > 1" class="pagination" aria-label="Pagination des anomalies">
        <button
          class="pagination__btn"
          :disabled="currentPage === 1"
          @click="goToPage(currentPage - 1)"
        >
          <font-awesome-icon :icon="['fas', 'chevron-left']" aria-hidden="true" />
          Précédent
        </button>

        <span class="pagination__info" aria-live="polite">
          Page {{ currentPage }} sur {{ totalPages }}
        </span>

        <button
          class="pagination__btn"
          :disabled="currentPage === totalPages"
          @click="goToPage(currentPage + 1)"
        >
          Suivant
          <font-awesome-icon :icon="['fas', 'chevron-right']" aria-hidden="true" />
        </button>
      </nav>
    </section>

    <ConfirmDialog
      :open="deleteDialog.open"
      title="Supprimer l'anomalie"
      :message="`Cette action supprimera définitivement l'anomalie${deleteDialog.field ? ' sur le champ « ' + deleteDialog.field + ' »' : ''}. Voulez-vous continuer ?`"
      variant="danger"
      confirm-label="Supprimer"
      :loading="loading"
      @confirm="confirmDeleteAnomaly"
      @cancel="closeDeleteDialog"
    />
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'
import { useDataQualityStore } from '@/stores/dataQuality'
import type { DataAnomaly, AnomalyType } from '@/types'
import { formatDate, downloadFile } from '@/utils/helpers'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'

const dataQualityStore = useDataQualityStore()

// État local
const severityFilter = ref<'all' | 'high' | 'medium' | 'low'>('all')
const typeFilter = ref<'all' | AnomalyType>('all')
const exportFormat = ref<'csv' | 'json'>('csv')
const importFormat = ref<'csv' | 'json'>('csv')
const editingAnomaly = ref<DataAnomaly | null>(null)
const editedValue = ref('')
const localError = ref<string | null>(null)
const successMessage = ref<string | null>(null)
const importFileInput = ref<HTMLInputElement | null>(null)

// Computed depuis le store
const anomalies = computed(() => {
  let filtered = dataQualityStore.anomalies
  
  if (severityFilter.value !== 'all') {
    filtered = filtered.filter(a => a.severity === severityFilter.value)
  }
  
  if (typeFilter.value !== 'all') {
    filtered = filtered.filter(a => a.type === typeFilter.value)
  }
  
  return filtered
})

const loading = computed(() => dataQualityStore.loading)
const error = computed(() => localError.value ?? dataQualityStore.error)
const totalAnomalies = computed(() => dataQualityStore.totalAnomalies)
const currentPage = computed(() => dataQualityStore.currentPage)
const pageSize = computed(() => dataQualityStore.pageSize)
const totalPages = computed(() => Math.ceil(totalAnomalies.value / pageSize.value))
const importAccept = computed(() =>
  importFormat.value === 'csv' ? '.csv,text/csv' : '.json,application/json',
)

// Actions
async function refreshData() {
  localError.value = null
  await dataQualityStore.fetchAnomalies()
}

function handleFilterChange() {
  dataQualityStore.currentPage = 1
  refreshData()
}

async function handleExportData() {
  try {
    localError.value = null
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `healthai-anomalies-${timestamp}.${exportFormat.value}`

    if (exportFormat.value === 'json') {
      const content = JSON.stringify(anomalies.value, null, 2)
      downloadFile(new Blob([content], { type: 'application/json' }), filename)
    } else {
      const csv = convertAnomaliesToCsv(anomalies.value)
      downloadFile(new Blob([csv], { type: 'text/csv;charset=utf-8' }), filename)
    }

    showSuccessMessage(`Export ${exportFormat.value.toUpperCase()} généré avec succès`)
  } catch (e) {
    console.error('Error exporting anomalies:', e)
    showErrorMessage('Erreur lors de l\'export des anomalies')
  }
}

function openImportDialog() {
  localError.value = null
  importFileInput.value?.click()
}

async function handleImportFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  try {
    localError.value = null
    const fileContent = await file.text()
    const importedAnomalies = importFormat.value === 'json'
      ? parseAnomaliesFromJson(fileContent)
      : parseAnomaliesFromCsv(fileContent)

    dataQualityStore.anomalies = importedAnomalies
    dataQualityStore.totalAnomalies = importedAnomalies.length
    dataQualityStore.currentPage = 1

    showSuccessMessage(`${importedAnomalies.length} anomalie(s) importée(s)`)
  } catch (e) {
    console.error('Error importing anomalies:', e)
    showErrorMessage('Fichier invalide. Vérifiez le format sélectionné puis réessayez.')
  } finally {
    target.value = ''
  }
}

function startEdit(anomaly: DataAnomaly) {
  editingAnomaly.value = anomaly
  editedValue.value = anomaly.suggestedValue || ''
}

function cancelEdit() {
  editingAnomaly.value = null
  editedValue.value = ''
}

async function saveEdit() {
  if (!editingAnomaly.value) return

  try {
    await dataQualityStore.updateAnomaly(editingAnomaly.value.id, {
      suggestedValue: editedValue.value,
    })
    showSuccessMessage('Modification enregistrée avec succès')
    cancelEdit()
  } catch (e) {
    console.error('Error saving edit:', e)
    showErrorMessage(e instanceof Error ? e.message : "Impossible d'enregistrer la modification")
  }
}

async function applyFix(anomaly: DataAnomaly) {
  if (!anomaly.suggestedValue) return

  try {
    await dataQualityStore.updateAnomaly(anomaly.id, {
      currentValue: anomaly.suggestedValue,
      status: 'approved',
    })
    showSuccessMessage('Correction appliquée avec succès')
    await refreshData()
  } catch (e) {
    console.error('Error applying fix:', e)
    showErrorMessage(e instanceof Error ? e.message : "Impossible d'appliquer la correction")
  }
}

const deleteDialog = reactive<{ open: boolean; id: string | null; field: string | null }>({
  open: false,
  id: null,
  field: null,
})

function deleteAnomaly(id: string) {
  const anomaly = dataQualityStore.anomalies.find((a) => a.id === id)
  deleteDialog.id = id
  deleteDialog.field = anomaly?.field ?? null
  deleteDialog.open = true
}

function closeDeleteDialog() {
  deleteDialog.open = false
  deleteDialog.id = null
  deleteDialog.field = null
}

async function confirmDeleteAnomaly() {
  if (!deleteDialog.id) return

  try {
    await dataQualityStore.deleteAnomaly(deleteDialog.id)
    showSuccessMessage('Anomalie supprimée avec succès')
    closeDeleteDialog()
  } catch (e) {
    console.error('Error deleting anomaly:', e)
    showErrorMessage(e instanceof Error ? e.message : "Impossible de supprimer l'anomalie")
    closeDeleteDialog()
  }
}

function goToPage(page: number) {
  dataQualityStore.currentPage = page
  refreshData()
}

function showSuccessMessage(message: string) {
  localError.value = null
  successMessage.value = message
  setTimeout(() => {
    successMessage.value = null
  }, 3000)
}

function showErrorMessage(message: string) {
  successMessage.value = null
  localError.value = message
  setTimeout(() => {
    localError.value = null
  }, 5000)
}

function convertAnomaliesToCsv(data: DataAnomaly[]): string {
  const headers = [
    'id',
    'type',
    'entityType',
    'entityId',
    'field',
    'currentValue',
    'suggestedValue',
    'detectedAt',
    'severity',
    'status',
  ]

  const rows = data.map((anomaly) => [
    anomaly.id,
    anomaly.type,
    anomaly.entityType,
    anomaly.entityId,
    anomaly.field,
    anomaly.currentValue ?? '',
    anomaly.suggestedValue ?? '',
    anomaly.detectedAt,
    anomaly.severity,
    anomaly.status,
  ])

  return [headers, ...rows]
    .map((row) => row.map(escapeCsvValue).join(','))
    .join('\n')
}

function escapeCsvValue(value: string): string {
  if (!value.includes(',') && !value.includes('"') && !value.includes('\n')) {
    return value
  }
  return `"${value.replaceAll('"', '""')}"`
}

function parseAnomaliesFromJson(content: string): DataAnomaly[] {
  const parsed: unknown = JSON.parse(content)
  if (!Array.isArray(parsed)) {
    throw new Error('JSON import must be an array')
  }
  return parsed.map((item, index) => normalizeImportedAnomaly(item, index))
}

function parseAnomaliesFromCsv(content: string): DataAnomaly[] {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  if (lines.length <= 1) {
    return []
  }

  const headerLine = lines[0]
  if (!headerLine) {
    return []
  }

  const headers = splitCsvLine(headerLine).map(normalizeHeader)
  const rows = lines.slice(1)

  return rows.map((line, index) => {
    const values = splitCsvLine(line)
    const rowData: Record<string, unknown> = {}

    headers.forEach((header, headerIndex) => {
      rowData[header] = values[headerIndex] ?? ''
    })

    return normalizeImportedAnomaly(rowData, index)
  })
}

function splitCsvLine(line: string): string[] {
  const values: string[] = []
  let current = ''
  let inQuotes = false

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]

    if (char === '"') {
      const nextChar = line[index + 1]
      if (inQuotes && nextChar === '"') {
        current += '"'
        index += 1
        continue
      }
      inQuotes = !inQuotes
      continue
    }

    if (char === ',' && !inQuotes) {
      values.push(current)
      current = ''
      continue
    }

    current += char
  }

  values.push(current)
  return values
}

function normalizeHeader(header: string): string {
  const compactHeader = header.replace(/\s+/g, '').toLowerCase()
  const aliases: Record<string, string> = {
    id: 'id',
    type: 'type',
    entitytype: 'entityType',
    entity_id: 'entityId',
    entityid: 'entityId',
    field: 'field',
    currentvalue: 'currentValue',
    suggestedvalue: 'suggestedValue',
    detectedat: 'detectedAt',
    severity: 'severity',
    status: 'status',
  }

  return aliases[compactHeader] ?? header
}

function normalizeImportedAnomaly(raw: unknown, index: number): DataAnomaly {
  const record = toRecord(raw)
  const now = new Date().toISOString()
  const id = readRecordValue(record, ['id']) || `imported-anomaly-${Date.now()}-${index}`
  const type = normalizeAnomalyType(readRecordValue(record, ['type']))
  const entityType = normalizeEntityType(readRecordValue(record, ['entityType', 'entity_type']))
  const entityId = readRecordValue(record, ['entityId', 'entity_id']) || `entity-${index + 1}`
  const field = readRecordValue(record, ['field']) || 'unknownField'
  const currentValue = readRecordValue(record, ['currentValue', 'current_value'])
  const suggestedValue = readRecordValue(record, ['suggestedValue', 'suggested_value'])
  const detectedAtRaw = readRecordValue(record, ['detectedAt', 'detected_at'])
  const severity = normalizeSeverity(readRecordValue(record, ['severity']))
  const status = normalizeStatus(readRecordValue(record, ['status']))

  return {
    id,
    type,
    entityType,
    entityId,
    field,
    currentValue: currentValue || null,
    suggestedValue: suggestedValue || undefined,
    detectedAt: isValidDate(detectedAtRaw) ? detectedAtRaw : now,
    severity,
    status,
  }
}

function toRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('Anomaly row must be an object')
  }
  return value as Record<string, unknown>
}

function readRecordValue(record: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = record[key]
    if (value === undefined || value === null) continue

    if (typeof value === 'string') {
      return value.trim()
    }

    return String(value)
  }

  return ''
}

function normalizeAnomalyType(value: string): AnomalyType {
  const validTypes: AnomalyType[] = ['missing_value', 'duplicate', 'outlier', 'format_error']
  return validTypes.includes(value as AnomalyType) ? (value as AnomalyType) : 'format_error'
}

function normalizeEntityType(value: string): DataAnomaly['entityType'] {
  const validEntityTypes: DataAnomaly['entityType'][] = ['user', 'nutrition', 'exercise', 'biometric']
  return validEntityTypes.includes(value as DataAnomaly['entityType'])
    ? (value as DataAnomaly['entityType'])
    : 'user'
}

function normalizeSeverity(value: string): DataAnomaly['severity'] {
  const validSeverities: DataAnomaly['severity'][] = ['low', 'medium', 'high']
  return validSeverities.includes(value as DataAnomaly['severity'])
    ? (value as DataAnomaly['severity'])
    : 'medium'
}

function normalizeStatus(value: string): DataAnomaly['status'] {
  const validStatus: DataAnomaly['status'][] = ['pending', 'approved', 'rejected']
  return validStatus.includes(value as DataAnomaly['status'])
    ? (value as DataAnomaly['status'])
    : 'pending'
}

function isValidDate(value: string): value is string {
  return value.length > 0 && !Number.isNaN(new Date(value).getTime())
}

// Helpers pour les icônes et labels
function getAnomalyTypeIcon(type: AnomalyType) {
  const icons = {
    missing_value: ['fas', 'circle-question'],
    duplicate: ['fas', 'copy'],
    outlier: ['fas', 'chart-line'],
    format_error: ['fas', 'file-circle-exclamation'],
  }
  return icons[type]
}

function getAnomalyTypeLabel(type: AnomalyType) {
  const labels = {
    missing_value: 'Valeur manquante',
    duplicate: 'Doublon',
    outlier: 'Valeur aberrante',
    format_error: 'Erreur de format',
  }
  return labels[type]
}

function getEntityIcon(entityType: string) {
  const icons = {
    user: ['fas', 'user'],
    nutrition: ['fas', 'utensils'],
    exercise: ['fas', 'dumbbell'],
    biometric: ['fas', 'heart-pulse'],
  }
  return icons[entityType as keyof typeof icons] || ['fas', 'file']
}

function getEntityLabel(entityType: string) {
  const labels = {
    user: 'Utilisateur',
    nutrition: 'Nutrition',
    exercise: 'Exercice',
    biometric: 'Biométrique',
  }
  return labels[entityType as keyof typeof labels] || entityType
}

function getSeverityIcon(severity: string) {
  const icons = {
    high: ['fas', 'circle-exclamation'],
    medium: ['fas', 'triangle-exclamation'],
    low: ['fas', 'circle-info'],
  }
  return icons[severity as keyof typeof icons]
}

function getSeverityLabel(severity: string) {
  const labels = {
    high: 'Élevée',
    medium: 'Moyenne',
    low: 'Faible',
  }
  return labels[severity as keyof typeof labels]
}

// Chargement initial
onMounted(async () => {
  await refreshData()
})
</script>

<style scoped>
.data-cleaning {
  max-width: 1600px;
  margin: 0 auto;
  padding: 2rem;
}

.page-header {
  margin-bottom: 2rem;
}

.page-title {
  margin: 0 0 0.5rem 0;
  font-size: 2rem;
  font-weight: 700;
  color: var(--c-text);
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.title-icon {
  color: var(--c-info);
}

.page-subtitle {
  margin: 0;
  font-size: 1.125rem;
  color: var(--c-text-muted);
}

/* Alerts */
.alert {
  padding: 1rem 1.5rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateY(-10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.alert-error {
  background: var(--c-danger-light);
  border: 1px solid rgba(255, 69, 58, 0.30);
  color: var(--c-danger);
}

.alert-success {
  background: var(--c-brand-xlight);
  border: 1px solid rgba(48, 209, 88, 0.25);
  color: var(--c-brand);
}

/* Action bar */
.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.action-bar__left {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.action-bar__right {
  display: flex;
  gap: 0.75rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--c-info-strong);
  color: #ffffff;
}

.btn-primary:hover:not(:disabled) {
  background: #004fa3;
}

.btn-secondary {
  background: var(--c-surface-2);
  color: var(--c-text);
  border: 1px solid var(--c-border);
}

.btn-secondary:hover:not(:disabled) {
  border-color: rgba(255, 255, 255, 0.20);
  background: var(--c-surface);
}

.filter-select {
  padding: 0.625rem 1rem;
  border: 1px solid var(--c-border);
  border-radius: 6px;
  font-size: 0.875rem;
  font-family: inherit;
  cursor: pointer;
  background: var(--c-surface-2);
  color: var(--c-text);
  transition: border-color 0.2s;
}

.filter-select:hover {
  border-color: var(--c-info);
}

.filter-select:focus {
  outline: 2px solid var(--c-info);
  outline-offset: 2px;
}

.filter-select--compact {
  min-width: 6rem;
}

.action-control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.anomaly-count {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: var(--c-surface-2);
  border: 1px solid var(--c-border);
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--c-text);
}

.file-input-hidden {
  display: none;
}

/* Loading */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 1rem;
}

.loading-spinner {
  color: var(--c-info);
}

/* Empty state */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  text-align: center;
  padding: 3rem;
}

.empty-state__icon {
  color: var(--c-brand);
  margin-bottom: 1rem;
}

.empty-state__title {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--c-text);
}

.empty-state__text {
  margin: 0;
  font-size: 1rem;
  color: var(--c-text-muted);
}

/* Table */
.table-container {
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.anomalies-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.anomalies-table thead {
  background: var(--c-surface-2);
}

.anomalies-table th {
  padding: 0.75rem 1rem;
  text-align: left;
  font-weight: 600;
  color: var(--c-text-muted);
  border-bottom: 1px solid var(--c-border);
}

.anomalies-table td {
  padding: 1rem;
  border-bottom: 1px solid var(--c-border);
  color: var(--c-text);
}

.anomalies-table tbody tr:hover {
  background: var(--c-surface-2);
}

.row-editing {
  background: var(--c-info-light) !important;
}

/* Badges */
.anomaly-type,
.entity-badge,
.severity-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.625rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.entity-badge--user {
  background: var(--c-info-light);
  color: var(--c-info);
}

.entity-badge--nutrition {
  background: var(--c-energy-light);
  color: var(--c-energy);
}

.entity-badge--exercise {
  background: rgba(191, 90, 242, 0.15);
  color: #bf5af2;
}

.entity-badge--biometric {
  background: var(--c-danger-light);
  color: var(--c-danger);
}

.severity-badge--high {
  background: var(--c-danger-light);
  color: var(--c-danger);
}

.severity-badge--medium {
  background: var(--c-energy-light);
  color: var(--c-energy);
}

.severity-badge--low {
  background: var(--c-info-light);
  color: var(--c-info);
}

.field-name {
  font-family: 'SFMono-Regular', ui-monospace, Menlo, Consolas, monospace;
  font-size: 0.8125rem;
  background: var(--c-surface-2);
  color: var(--c-text);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.current-value {
  color: var(--c-text-muted);
}

.suggested-value {
  color: var(--c-brand);
  font-weight: 500;
}

.input-inline {
  padding: 0.375rem 0.625rem;
  border: 1px solid var(--c-border);
  border-radius: 4px;
  font-size: 0.875rem;
  font-family: inherit;
  background: var(--c-surface-2);
  color: var(--c-text);
  width: 100%;
  max-width: 200px;
}

.input-inline:focus {
  outline: 2px solid var(--c-info);
  outline-offset: 0;
}

/* Action buttons */
.action-buttons {
  display: flex;
  gap: 0.375rem;
}

.btn-icon {
  padding: 0.5rem;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
  color: var(--c-text-muted);
}

.btn-icon:hover:not(:disabled) {
  background: var(--c-surface-2);
}

.btn-icon:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-icon--primary:hover:not(:disabled) {
  color: var(--c-info);
  background: var(--c-info-light);
}

.btn-icon--success:hover:not(:disabled) {
  color: var(--c-brand);
  background: var(--c-brand-xlight);
}

.btn-icon--danger:hover:not(:disabled) {
  color: var(--c-danger);
  background: var(--c-danger-light);
}

.btn-icon--secondary:hover:not(:disabled) {
  color: var(--c-text);
  background: var(--c-surface-2);
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 1.5rem;
  padding: 1rem;
}

.pagination__btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  border: 1px solid var(--c-border);
  background: var(--c-surface-2);
  color: var(--c-text);
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.pagination__btn:hover:not(:disabled) {
  border-color: var(--c-info);
  background: var(--c-info-light);
  color: var(--c-info);
}

.pagination__btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pagination__info {
  font-size: 0.875rem;
  color: var(--c-text-muted);
  font-weight: 500;
}

/* Responsive */
@media (max-width: 1200px) {
  .table-container {
    overflow-x: auto;
  }

  .anomalies-table {
    min-width: 1000px;
  }
}

@media (max-width: 768px) {
  .data-cleaning {
    padding: 1rem;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .action-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .action-bar__left,
  .action-bar__right {
    width: 100%;
  }

  .action-control {
    width: 100%;
  }
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

@media (prefers-reduced-motion: reduce) {
  .alert {
    animation: none;
  }
}
</style>
