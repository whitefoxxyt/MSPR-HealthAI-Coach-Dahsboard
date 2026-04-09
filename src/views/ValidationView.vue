<template>
  <div class="validation">
    <header class="page-header">
      <h1 class="page-title">
        <font-awesome-icon :icon="['fas', 'clipboard-check']" class="title-icon" />
        Workflow de validation
      </h1>
      <p class="page-subtitle">
        Approuvez ou rejetez les données en attente de validation
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

    <!-- Statistiques -->
    <section class="stats-section">
      <div class="stat-card">
        <div class="stat-card__icon stat-card__icon--pending">
          <font-awesome-icon :icon="['fas', 'clock']" />
        </div>
        <div class="stat-card__content">
          <div class="stat-card__value">{{ pendingCount }}</div>
          <div class="stat-card__label">En attente</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-card__icon stat-card__icon--approved">
          <font-awesome-icon :icon="['fas', 'circle-check']" />
        </div>
        <div class="stat-card__content">
          <div class="stat-card__value">{{ approvedCount }}</div>
          <div class="stat-card__label">Approuvés</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-card__icon stat-card__icon--rejected">
          <font-awesome-icon :icon="['fas', 'circle-xmark']" />
        </div>
        <div class="stat-card__content">
          <div class="stat-card__value">{{ rejectedCount }}</div>
          <div class="stat-card__label">Rejetés</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-card__icon stat-card__icon--total">
          <font-awesome-icon :icon="['fas', 'database']" />
        </div>
        <div class="stat-card__content">
          <div class="stat-card__value">{{ totalRecords }}</div>
          <div class="stat-card__label">Total</div>
        </div>
      </div>
    </section>

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
        
        <div class="filter-tabs">
          <button 
            class="filter-tab"
            :class="{ 'filter-tab--active': statusFilter === 'all' }"
            @click="setStatusFilter('all')"
          >
            <font-awesome-icon :icon="['fas', 'list']" />
            Tous
          </button>
          <button 
            class="filter-tab"
            :class="{ 'filter-tab--active': statusFilter === 'pending' }"
            @click="setStatusFilter('pending')"
          >
            <font-awesome-icon :icon="['fas', 'clock']" />
            En attente
          </button>
          <button 
            class="filter-tab"
            :class="{ 'filter-tab--active': statusFilter === 'approved' }"
            @click="setStatusFilter('approved')"
          >
            <font-awesome-icon :icon="['fas', 'circle-check']" />
            Approuvés
          </button>
          <button 
            class="filter-tab"
            :class="{ 'filter-tab--active': statusFilter === 'rejected' }"
            @click="setStatusFilter('rejected')"
          >
            <font-awesome-icon :icon="['fas', 'circle-xmark']" />
            Rejetés
          </button>
        </div>
      </div>

      <div class="action-bar__right" v-if="selectedRecords.length > 0">
        <span class="selection-count">
          <font-awesome-icon :icon="['fas', 'check-square']" />
          {{ selectedRecords.length }} sélectionné(s)
        </span>
        <button 
          class="btn btn-success" 
          @click="batchApprove"
          :disabled="loading"
        >
          <font-awesome-icon :icon="['fas', 'thumbs-up']" />
          Approuver
        </button>
        <button 
          class="btn btn-danger" 
          @click="batchReject"
          :disabled="loading"
        >
          <font-awesome-icon :icon="['fas', 'thumbs-down']" />
          Rejeter
        </button>
      </div>
    </section>

    <!-- Loading spinner -->
    <div v-if="loading && records.length === 0" class="loading-container">
      <font-awesome-icon :icon="['fas', 'spinner']" spin size="3x" class="loading-spinner" />
      <p>Chargement des enregistrements...</p>
    </div>

    <!-- Liste des enregistrements -->
    <section v-else class="records-section">
      <div v-if="records.length === 0" class="empty-state">
        <font-awesome-icon :icon="['fas', 'inbox']" size="3x" class="empty-state__icon" />
        <h2 class="empty-state__title">Aucun enregistrement</h2>
        <p class="empty-state__text">
          Il n'y a aucun enregistrement avec ce statut.
        </p>
      </div>

      <div v-else class="records-grid">
        <article 
          v-for="record in records" 
          :key="record.id"
          class="record-card"
          :class="{ 
            'record-card--selected': selectedRecords.includes(record.id),
            'record-card--editing': editingRecord?.id === record.id
          }"
        >
          <!-- Header -->
          <header class="record-card__header">
            <div class="record-card__header-left">
              <input 
                v-if="record.status === 'pending'"
                type="checkbox"
                :checked="selectedRecords.includes(record.id)"
                @change="toggleSelection(record.id)"
                class="record-checkbox"
                :id="`record-${record.id}`"
              />
              <label 
                v-if="record.status === 'pending'"
                :for="`record-${record.id}`"
                class="sr-only"
              >
                Sélectionner l'enregistrement
              </label>
              
              <span class="record-type-badge" :class="`record-type-badge--${record.type}`">
                <font-awesome-icon :icon="getRecordTypeIcon(record.type)" />
                {{ getRecordTypeLabel(record.type) }}
              </span>
            </div>
            
            <span class="record-status" :class="`record-status--${record.status}`">
              <font-awesome-icon :icon="getStatusIcon(record.status)" />
              {{ getStatusLabel(record.status) }}
            </span>
          </header>

          <!-- Content -->
          <div class="record-card__content">
            <div class="record-id">
              <span class="record-id__label">ID:</span>
              <code class="record-id__value">{{ record.id }}</code>
            </div>

            <!-- Data preview -->
            <div class="data-preview">
              <h4 class="data-preview__title">
                <font-awesome-icon :icon="['fas', 'code']" />
                Données
              </h4>
              <div class="data-preview__content">
                <template v-if="editingRecord?.id === record.id">
                  <textarea 
                    v-model="editedData"
                    class="data-textarea"
                    rows="8"
                  ></textarea>
                </template>
                <template v-else>
                  <pre class="data-json">{{ formatJSON(record.data) }}</pre>
                </template>
              </div>
            </div>

            <!-- Metadata -->
            <div class="record-meta">
              <div class="meta-item">
                <font-awesome-icon :icon="['fas', 'calendar-plus']" class="meta-icon" />
                <span class="meta-label">Créé:</span>
                <time :datetime="record.createdAt" class="meta-value">
                  {{ formatDate(record.createdAt) }}
                </time>
              </div>
              
              <div class="meta-item">
                <font-awesome-icon :icon="['fas', 'calendar-check']" class="meta-icon" />
                <span class="meta-label">Modifié:</span>
                <time :datetime="record.updatedAt" class="meta-value">
                  {{ formatDate(record.updatedAt) }}
                </time>
              </div>

              <div v-if="record.validatedBy" class="meta-item">
                <font-awesome-icon :icon="['fas', 'user-check']" class="meta-icon" />
                <span class="meta-label">Validé par:</span>
                <span class="meta-value">{{ record.validatedBy }}</span>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <footer class="record-card__footer">
            <template v-if="editingRecord?.id === record.id">
              <button 
                class="btn btn-sm btn-success"
                @click="saveEdit"
              >
                <font-awesome-icon :icon="['fas', 'check']" />
                Enregistrer
              </button>
              <button 
                class="btn btn-sm btn-secondary"
                @click="cancelEdit"
              >
                <font-awesome-icon :icon="['fas', 'xmark']" />
                Annuler
              </button>
            </template>
            <template v-else-if="record.status === 'pending'">
              <button 
                class="btn btn-sm btn-secondary"
                @click="startEdit(record)"
              >
                <font-awesome-icon :icon="['fas', 'pen']" />
                Éditer
              </button>
              <button 
                class="btn btn-sm btn-success"
                @click="validateRecord(record.id, 'approved')"
              >
                <font-awesome-icon :icon="['fas', 'thumbs-up']" />
                Approuver
              </button>
              <button 
                class="btn btn-sm btn-danger"
                @click="validateRecord(record.id, 'rejected')"
              >
                <font-awesome-icon :icon="['fas', 'thumbs-down']" />
                Rejeter
              </button>
            </template>
            <template v-else>
              <button 
                class="btn btn-sm btn-secondary"
                @click="viewDetails(record)"
              >
                <font-awesome-icon :icon="['fas', 'eye']" />
                Voir détails
              </button>
            </template>
          </footer>
        </article>
      </div>

      <!-- Pagination -->
      <nav v-if="totalPages > 1" class="pagination" aria-label="Pagination">
        <button 
          class="pagination__btn"
          :disabled="currentPage === 1"
          @click="goToPage(currentPage - 1)"
        >
          <font-awesome-icon :icon="['fas', 'chevron-left']" />
          Précédent
        </button>
        
        <div class="pagination__pages">
          <button
            v-for="page in visiblePages"
            :key="page"
            class="pagination__page"
            :class="{ 'pagination__page--active': page === currentPage }"
            @click="goToPage(page)"
          >
            {{ page }}
          </button>
        </div>
        
        <button 
          class="pagination__btn"
          :disabled="currentPage === totalPages"
          @click="goToPage(currentPage + 1)"
        >
          Suivant
          <font-awesome-icon :icon="['fas', 'chevron-right']" />
        </button>
      </nav>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useValidationStore } from '@/stores/validation'
import type { DataRecord, ValidationStatus } from '@/types'
import { formatDate } from '@/utils/helpers'

const validationStore = useValidationStore()

// État local
const selectedRecords = ref<string[]>([])
const editingRecord = ref<DataRecord | null>(null)
const editedData = ref('')
const successMessage = ref<string | null>(null)

// Computed depuis le store
const records = computed(() => validationStore.records)
const loading = computed(() => validationStore.loading)
const error = computed(() => validationStore.error)
const totalRecords = computed(() => validationStore.totalRecords)
const currentPage = computed(() => validationStore.currentPage)
const totalPages = computed(() => validationStore.totalPages)
const statusFilter = computed(() => validationStore.statusFilter)
const pendingCount = computed(() => validationStore.pendingRecords.length)
const approvedCount = computed(() => validationStore.approvedRecords.length)
const rejectedCount = computed(() => validationStore.rejectedRecords.length)

// Pages visibles pour la pagination
const visiblePages = computed(() => {
  const pages: number[] = []
  const maxVisible = 5
  const half = Math.floor(maxVisible / 2)
  
  let start = Math.max(1, currentPage.value - half)
  const end = Math.min(totalPages.value, start + maxVisible - 1)
  
  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1)
  }
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
})

// Actions
async function refreshData() {
  await validationStore.fetchRecords()
}

function setStatusFilter(status: ValidationStatus | 'all') {
  validationStore.setStatusFilter(status)
  selectedRecords.value = []
}

function toggleSelection(id: string) {
  const index = selectedRecords.value.indexOf(id)
  if (index > -1) {
    selectedRecords.value.splice(index, 1)
  } else {
    selectedRecords.value.push(id)
  }
}

function startEdit(record: DataRecord) {
  editingRecord.value = record
  editedData.value = JSON.stringify(record.data, null, 2)
}

function cancelEdit() {
  editingRecord.value = null
  editedData.value = ''
}

async function saveEdit() {
  if (!editingRecord.value) return
  
  try {
    const parsedData = JSON.parse(editedData.value)
    await validationStore.updateRecord(editingRecord.value.id, {
      data: parsedData,
    })
    showSuccessMessage('Modification enregistrée avec succès')
    cancelEdit()
  } catch (e) {
    alert('Erreur: JSON invalide')
    console.error('Error saving edit:', e)
  }
}

async function validateRecord(id: string, status: 'approved' | 'rejected') {
  try {
    await validationStore.validateRecord(id, status)
    showSuccessMessage(`Enregistrement ${status === 'approved' ? 'approuvé' : 'rejeté'} avec succès`)
    selectedRecords.value = selectedRecords.value.filter(rid => rid !== id)
  } catch (e) {
    console.error('Error validating record:', e)
  }
}

async function batchApprove() {
  if (!confirm(`Approuver ${selectedRecords.value.length} enregistrement(s) ?`)) return
  
  try {
    await validationStore.batchValidate(selectedRecords.value, 'approved')
    showSuccessMessage(`${selectedRecords.value.length} enregistrement(s) approuvé(s)`)
    selectedRecords.value = []
  } catch (e) {
    console.error('Error batch approving:', e)
  }
}

async function batchReject() {
  if (!confirm(`Rejeter ${selectedRecords.value.length} enregistrement(s) ?`)) return
  
  try {
    await validationStore.batchValidate(selectedRecords.value, 'rejected')
    showSuccessMessage(`${selectedRecords.value.length} enregistrement(s) rejeté(s)`)
    selectedRecords.value = []
  } catch (e) {
    console.error('Error batch rejecting:', e)
  }
}

function viewDetails(record: DataRecord) {
  alert(`Détails de l'enregistrement:\n\n${JSON.stringify(record, null, 2)}`)
}

function goToPage(page: number) {
  validationStore.setPage(page)
  selectedRecords.value = []
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function showSuccessMessage(message: string) {
  successMessage.value = message
  setTimeout(() => {
    successMessage.value = null
  }, 3000)
}

// Helpers
function formatJSON(data: Record<string, unknown>) {
  return JSON.stringify(data, null, 2)
}

function getRecordTypeIcon(type: string) {
  const icons = {
    user: ['fas', 'user'],
    nutrition: ['fas', 'utensils'],
    exercise: ['fas', 'dumbbell'],
    biometric: ['fas', 'heart-pulse'],
  }
  return icons[type as keyof typeof icons] || ['fas', 'file']
}

function getRecordTypeLabel(type: string) {
  const labels = {
    user: 'Utilisateur',
    nutrition: 'Nutrition',
    exercise: 'Exercice',
    biometric: 'Biométrique',
  }
  return labels[type as keyof typeof labels] || type
}

function getStatusIcon(status: string) {
  const icons = {
    pending: ['fas', 'clock'],
    approved: ['fas', 'circle-check'],
    rejected: ['fas', 'circle-xmark'],
  }
  return icons[status as keyof typeof icons]
}

function getStatusLabel(status: string) {
  const labels = {
    pending: 'En attente',
    approved: 'Approuvé',
    rejected: 'Rejeté',
  }
  return labels[status as keyof typeof labels]
}

// Chargement initial
onMounted(async () => {
  await refreshData()
})
</script>

<style scoped>
.validation {
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
  color: #111827;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.title-icon {
  color: #3b82f6;
}

.page-subtitle {
  margin: 0;
  font-size: 1.125rem;
  color: #6b7280;
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
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
}

.alert-success {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #166534;
}

/* Stats section */
.stats-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stat-card__icon {
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-size: 1.5rem;
}

.stat-card__icon--pending {
  background: #fef3c7;
  color: #92400e;
}

.stat-card__icon--approved {
  background: #d1fae5;
  color: #065f46;
}

.stat-card__icon--rejected {
  background: #fee2e2;
  color: #991b1b;
}

.stat-card__icon--total {
  background: #dbeafe;
  color: #1e40af;
}

.stat-card__value {
  font-size: 2rem;
  font-weight: 700;
  color: #111827;
  line-height: 1;
}

.stat-card__label {
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 0.25rem;
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
  flex: 1;
}

.action-bar__right {
  display: flex;
  gap: 0.75rem;
  align-items: center;
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
  background: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-success {
  background: #10b981;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #059669;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #dc2626;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #4b5563;
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.8125rem;
}

.filter-tabs {
  display: flex;
  gap: 0.25rem;
  background: white;
  padding: 0.25rem;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.filter-tab {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  background: transparent;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.filter-tab:hover {
  background: #f3f4f6;
  color: #111827;
}

.filter-tab--active {
  background: #3b82f6;
  color: white;
}

.filter-tab--active:hover {
  background: #2563eb;
}

.selection-count {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: #eff6ff;
  color: #1e40af;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
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
  color: #3b82f6;
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
  color: #9ca3af;
  margin-bottom: 1rem;
}

.empty-state__title {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
}

.empty-state__text {
  margin: 0;
  font-size: 1rem;
  color: #6b7280;
}

/* Records grid */
.records-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
  gap: 1.5rem;
}

.record-card {
  background: white;
  border-radius: 8px;
  border: 2px solid #e5e7eb;
  overflow: hidden;
  transition: all 0.2s;
}

.record-card:hover {
  border-color: #d1d5db;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.record-card--selected {
  border-color: #3b82f6;
  background: #eff6ff;
}

.record-card--editing {
  border-color: #f59e0b;
  background: #fffbeb;
}

.record-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.record-card__header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.record-checkbox {
  width: 1.125rem;
  height: 1.125rem;
  cursor: pointer;
}

.record-type-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.8125rem;
  font-weight: 500;
}

.record-type-badge--user {
  background: #dbeafe;
  color: #1e40af;
}

.record-type-badge--nutrition {
  background: #fef3c7;
  color: #92400e;
}

.record-type-badge--exercise {
  background: #ddd6fe;
  color: #5b21b6;
}

.record-type-badge--biometric {
  background: #fecaca;
  color: #991b1b;
}

.record-status {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.record-status--pending {
  background: #fef3c7;
  color: #92400e;
}

.record-status--approved {
  background: #d1fae5;
  color: #065f46;
}

.record-status--rejected {
  background: #fee2e2;
  color: #991b1b;
}

.record-card__content {
  padding: 1.25rem;
}

.record-id {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
}

.record-id__label {
  color: #6b7280;
  font-weight: 500;
}

.record-id__value {
  font-family: 'Courier New', monospace;
  background: #f3f4f6;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  color: #374151;
}

.data-preview {
  margin-bottom: 1rem;
}

.data-preview__title {
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.data-preview__content {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
}

.data-json {
  padding: 1rem;
  margin: 0;
  font-family: 'Courier New', monospace;
  font-size: 0.75rem;
  line-height: 1.5;
  color: #374151;
  overflow-x: auto;
  max-height: 300px;
  overflow-y: auto;
}

.data-textarea {
  width: 100%;
  padding: 1rem;
  border: none;
  font-family: 'Courier New', monospace;
  font-size: 0.75rem;
  line-height: 1.5;
  color: #374151;
  background: #fffbeb;
  resize: vertical;
}

.data-textarea:focus {
  outline: none;
  background: white;
}

.record-meta {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  color: #6b7280;
}

.meta-icon {
  color: #9ca3af;
}

.meta-label {
  font-weight: 500;
}

.meta-value {
  color: #374151;
}

.record-card__footer {
  display: flex;
  gap: 0.5rem;
  padding: 1rem 1.25rem;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.75rem;
  margin-top: 2rem;
  padding: 1rem;
}

.pagination__btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.pagination__btn:hover:not(:disabled) {
  border-color: #3b82f6;
  background: #eff6ff;
  color: #3b82f6;
}

.pagination__btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pagination__pages {
  display: flex;
  gap: 0.25rem;
}

.pagination__page {
  min-width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.pagination__page:hover {
  border-color: #3b82f6;
  background: #eff6ff;
  color: #3b82f6;
}

.pagination__page--active {
  border-color: #3b82f6;
  background: #3b82f6;
  color: white;
}

.pagination__page--active:hover {
  background: #2563eb;
  border-color: #2563eb;
}

/* Accessibilité */
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

/* Responsive */
@media (max-width: 1024px) {
  .records-grid {
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  }
}

@media (max-width: 768px) {
  .validation {
    padding: 1rem;
  }
  
  .page-title {
    font-size: 1.5rem;
  }
  
  .stats-section {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }
  
  .stat-card {
    padding: 1rem;
  }
  
  .stat-card__value {
    font-size: 1.5rem;
  }
  
  .action-bar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .action-bar__left,
  .action-bar__right {
    width: 100%;
    flex-direction: column;
  }
  
  .filter-tabs {
    flex-direction: column;
  }
  
  .records-grid {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .alert,
  .record-card {
    animation: none;
    transition: none;
  }
}
</style>
