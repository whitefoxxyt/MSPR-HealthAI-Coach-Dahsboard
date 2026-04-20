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
    <div v-if="error || localError" class="alert alert-error" role="alert">
      <font-awesome-icon :icon="['fas', 'triangle-exclamation']" aria-hidden="true" />
      {{ localError || error }}
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
              <h3 class="data-preview__title">
                <font-awesome-icon :icon="['fas', 'code']" aria-hidden="true" />
                Données
              </h3>
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
      <nav v-if="totalPages > 1" class="pagination" aria-label="Pagination des enregistrements">
        <button
          class="pagination__btn"
          :disabled="currentPage === 1"
          @click="goToPage(currentPage - 1)"
        >
          <font-awesome-icon :icon="['fas', 'chevron-left']" aria-hidden="true" />
          Précédent
        </button>

        <div class="pagination__pages">
          <button
            v-for="page in visiblePages"
            :key="page"
            class="pagination__page"
            :class="{ 'pagination__page--active': page === currentPage }"
            :aria-label="`Aller à la page ${page}`"
            :aria-current="page === currentPage ? 'page' : undefined"
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
          <font-awesome-icon :icon="['fas', 'chevron-right']" aria-hidden="true" />
        </button>
      </nav>
    </section>

    <ConfirmDialog
      :open="batchDialog.open"
      :title="batchDialog.action === 'approved' ? 'Approuver les enregistrements' : 'Rejeter les enregistrements'"
      :message="batchDialog.action === 'approved'
        ? `Approuver ${selectedRecords.length} enregistrement(s) ? Ils passeront en production.`
        : `Rejeter ${selectedRecords.length} enregistrement(s) ? Cette action est réversible mais bloquera leur mise en production.`"
      :variant="batchDialog.action === 'approved' ? 'success' : 'danger'"
      :confirm-label="batchDialog.action === 'approved' ? 'Approuver' : 'Rejeter'"
      :loading="loading"
      @confirm="confirmBatch"
      @cancel="closeBatchDialog"
    />

    <BaseModal
      :open="detailsDialog.open"
      title="Détails de l'enregistrement"
      @close="closeDetailsDialog"
    >
      <dl v-if="detailsDialog.record" class="details-list">
        <div class="details-list__row">
          <dt>Identifiant</dt>
          <dd><code>{{ detailsDialog.record.id }}</code></dd>
        </div>
        <div class="details-list__row">
          <dt>Type</dt>
          <dd>{{ detailsDialog.record.type }}</dd>
        </div>
        <div class="details-list__row">
          <dt>Statut</dt>
          <dd>{{ detailsDialog.record.status }}</dd>
        </div>
        <div class="details-list__row">
          <dt>Soumis le</dt>
          <dd>{{ formatDate(detailsDialog.record.createdAt) }}</dd>
        </div>
      </dl>
      <h3 class="details-subtitle">Données</h3>
      <pre v-if="detailsDialog.record" class="details-json">{{ formatJSON(detailsDialog.record.data) }}</pre>

      <template #footer>
        <button type="button" class="btn btn-secondary" @click="closeDetailsDialog">
          Fermer
        </button>
      </template>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'
import { useValidationStore } from '@/stores/validation'
import type { DataRecord, ValidationStatus } from '@/types'
import { formatDate } from '@/utils/helpers'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import BaseModal from '@/components/common/BaseModal.vue'

const validationStore = useValidationStore()

// État local
const selectedRecords = ref<string[]>([])
const editingRecord = ref<DataRecord | null>(null)
const editedData = ref('')
const successMessage = ref<string | null>(null)
const localError = ref<string | null>(null)

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
    console.error('Error saving edit:', e)
    if (e instanceof SyntaxError) {
      showErrorMessage('JSON invalide : vérifiez la syntaxe avant d\'enregistrer')
    } else {
      showErrorMessage(e instanceof Error ? e.message : "Impossible d'enregistrer la modification")
    }
  }
}

async function validateRecord(id: string, status: 'approved' | 'rejected') {
  try {
    await validationStore.validateRecord(id, status)
    showSuccessMessage(`Enregistrement ${status === 'approved' ? 'approuvé' : 'rejeté'} avec succès`)
    selectedRecords.value = selectedRecords.value.filter(rid => rid !== id)
  } catch (e) {
    console.error('Error validating record:', e)
    showErrorMessage(e instanceof Error ? e.message : "Impossible de valider l'enregistrement")
  }
}

const batchDialog = reactive<{ open: boolean; action: 'approved' | 'rejected' | null }>({
  open: false,
  action: null,
})

function batchApprove() {
  if (selectedRecords.value.length === 0) return
  batchDialog.action = 'approved'
  batchDialog.open = true
}

function batchReject() {
  if (selectedRecords.value.length === 0) return
  batchDialog.action = 'rejected'
  batchDialog.open = true
}

function closeBatchDialog() {
  batchDialog.open = false
  batchDialog.action = null
}

async function confirmBatch() {
  if (!batchDialog.action) return
  const action = batchDialog.action
  const count = selectedRecords.value.length
  try {
    await validationStore.batchValidate(selectedRecords.value, action)
    showSuccessMessage(`${count} enregistrement(s) ${action === 'approved' ? 'approuvé(s)' : 'rejeté(s)'}`)
    selectedRecords.value = []
    closeBatchDialog()
  } catch (e) {
    console.error('Error batch validating:', e)
    showErrorMessage(
      e instanceof Error
        ? e.message
        : action === 'approved'
          ? "Impossible d'approuver les enregistrements"
          : 'Impossible de rejeter les enregistrements',
    )
    closeBatchDialog()
  }
}

const detailsDialog = reactive<{ open: boolean; record: DataRecord | null }>({
  open: false,
  record: null,
})

function viewDetails(record: DataRecord) {
  detailsDialog.record = record
  detailsDialog.open = true
}

function closeDetailsDialog() {
  detailsDialog.open = false
  detailsDialog.record = null
}

function goToPage(page: number) {
  validationStore.setPage(page)
  selectedRecords.value = []
  window.scrollTo({ top: 0, behavior: 'smooth' })
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

/* Stats section */
.stats-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: 8px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: var(--shadow-sm);
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
  background: var(--c-energy-light);
  color: var(--c-energy);
}

.stat-card__icon--approved {
  background: var(--c-brand-xlight);
  color: var(--c-brand);
}

.stat-card__icon--rejected {
  background: var(--c-danger-light);
  color: var(--c-danger);
}

.stat-card__icon--total {
  background: var(--c-info-light);
  color: var(--c-info);
}

.stat-card__value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--c-text);
  line-height: 1;
}

.stat-card__label {
  font-size: 0.875rem;
  color: var(--c-text-muted);
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
  background: var(--c-info-strong);
  color: #ffffff;
}

.btn-primary:hover:not(:disabled) {
  background: #004fa3;
}

.btn-success {
  background: var(--c-brand);
  color: #000000;
}

.btn-success:hover:not(:disabled) {
  background: var(--c-brand-dark);
  color: #ffffff;
}

.btn-danger {
  background: var(--c-danger);
  color: #ffffff;
}

.btn-danger:hover:not(:disabled) {
  background: #cc2f27;
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

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.8125rem;
}

.filter-tabs {
  display: flex;
  gap: 0.25rem;
  background: var(--c-surface-2);
  padding: 0.25rem;
  border-radius: 8px;
  border: 1px solid var(--c-border);
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
  color: var(--c-text-muted);
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.filter-tab:hover {
  background: var(--c-surface);
  color: var(--c-text);
}

.filter-tab--active {
  background: var(--c-info-strong);
  color: #ffffff;
}

.filter-tab--active:hover {
  background: #004fa3;
}

.selection-count {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: var(--c-info-light);
  color: var(--c-info);
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
  color: var(--c-text-muted);
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

/* Records grid */
.records-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
  gap: 1.5rem;
}

.record-card {
  background: var(--c-surface);
  border-radius: 8px;
  border: 2px solid var(--c-border);
  overflow: hidden;
  transition: all 0.2s;
}

.record-card:hover {
  border-color: rgba(255, 255, 255, 0.15);
  box-shadow: var(--shadow-md);
}

.record-card--selected {
  border-color: var(--c-info);
  background: var(--c-info-light);
}

.record-card--editing {
  border-color: var(--c-energy);
  background: var(--c-energy-light);
}

.record-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  background: var(--c-surface-2);
  border-bottom: 1px solid var(--c-border);
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
  accent-color: var(--c-info);
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
  background: var(--c-info-light);
  color: var(--c-info);
}

.record-type-badge--nutrition {
  background: var(--c-energy-light);
  color: var(--c-energy);
}

.record-type-badge--exercise {
  background: rgba(191, 90, 242, 0.15);
  color: #bf5af2;
}

.record-type-badge--biometric {
  background: var(--c-danger-light);
  color: var(--c-danger);
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
  background: var(--c-energy-light);
  color: var(--c-energy);
}

.record-status--approved {
  background: var(--c-brand-xlight);
  color: var(--c-brand);
}

.record-status--rejected {
  background: var(--c-danger-light);
  color: var(--c-danger);
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
  color: var(--c-text-muted);
  font-weight: 500;
}

.record-id__value {
  font-family: 'SFMono-Regular', ui-monospace, Menlo, Consolas, monospace;
  background: var(--c-surface-2);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  color: var(--c-text);
}

.data-preview {
  margin-bottom: 1rem;
}

.data-preview__title {
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--c-text);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.data-preview__content {
  background: var(--c-surface-2);
  border: 1px solid var(--c-border);
  border-radius: 6px;
  overflow: hidden;
}

.data-json {
  padding: 1rem;
  margin: 0;
  font-family: 'SFMono-Regular', ui-monospace, Menlo, Consolas, monospace;
  font-size: 0.75rem;
  line-height: 1.5;
  color: var(--c-text);
  overflow-x: auto;
  max-height: 300px;
  overflow-y: auto;
}

.data-textarea {
  width: 100%;
  padding: 1rem;
  border: none;
  font-family: 'SFMono-Regular', ui-monospace, Menlo, Consolas, monospace;
  font-size: 0.75rem;
  line-height: 1.5;
  color: var(--c-text);
  background: var(--c-energy-light);
  resize: vertical;
}

.data-textarea:focus {
  outline: none;
  background: var(--c-surface-2);
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
  color: var(--c-text-muted);
}

.meta-icon {
  color: var(--c-text-muted);
}

.meta-label {
  font-weight: 500;
}

.meta-value {
  color: var(--c-text);
}

.record-card__footer {
  display: flex;
  gap: 0.5rem;
  padding: 1rem 1.25rem;
  background: var(--c-surface-2);
  border-top: 1px solid var(--c-border);
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

.pagination__page:hover {
  border-color: var(--c-info);
  background: var(--c-info-light);
  color: var(--c-info);
}

.pagination__page--active {
  border-color: var(--c-info);
  background: var(--c-info);
  color: #ffffff;
}

.pagination__page--active:hover {
  background: #0070d6;
  border-color: #0070d6;
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

/* Details modal */
.details-list {
  margin: 0 0 1.25rem 0;
  padding: 0;
  display: grid;
  gap: 0.625rem;
}

.details-list__row {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 0.75rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--c-border);
}

.details-list__row:last-child {
  border-bottom: none;
}

.details-list dt {
  margin: 0;
  color: var(--c-text-muted);
  font-size: 0.8125rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.details-list dd {
  margin: 0;
  color: var(--c-text);
  font-size: 0.9375rem;
}

.details-list dd code {
  padding: 0.15rem 0.4rem;
  background: var(--c-surface-2);
  border-radius: 4px;
  font-size: 0.8125rem;
  font-family: 'SFMono-Regular', ui-monospace, Menlo, Consolas, monospace;
  color: var(--c-text);
}

.details-subtitle {
  margin: 0 0 0.5rem 0;
  color: var(--c-text-muted);
  font-size: 0.875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.details-json {
  margin: 0;
  padding: 1rem;
  background: #000000;
  color: var(--c-text);
  border: 1px solid var(--c-border);
  border-radius: 8px;
  font-size: 0.8125rem;
  line-height: 1.5;
  overflow-x: auto;
  font-family: 'SFMono-Regular', ui-monospace, Menlo, Consolas, monospace;
}

.btn:focus-visible {
  outline: 2px solid var(--c-info);
  outline-offset: 2px;
}
</style>
