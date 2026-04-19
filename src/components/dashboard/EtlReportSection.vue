<template>
  <section class="etl-section" aria-labelledby="etl-title">
    <header class="etl-section__header">
      <div>
        <h2 id="etl-title" class="section-title">Rapport ETL</h2>
        <p class="section-subtitle">Dernière exécution : {{ report.generatedAt }}</p>
      </div>
      <dl class="etl-totals">
        <div class="etl-total">
          <dt>Lus</dt>
          <dd>{{ report.totals.rowsRead.toLocaleString('fr-FR') }}</dd>
        </div>
        <div class="etl-total">
          <dt>Insérés</dt>
          <dd class="etl-total--ok">{{ report.totals.rowsInserted.toLocaleString('fr-FR') }}</dd>
        </div>
        <div class="etl-total">
          <dt>Rejetés</dt>
          <dd class="etl-total--warn">{{ report.totals.rowsRejected.toLocaleString('fr-FR') }}</dd>
        </div>
        <div class="etl-total">
          <dt>Taux de rejet</dt>
          <dd :class="report.totals.rejectionRate > 0.05 ? 'etl-total--warn' : 'etl-total--ok'">
            {{ (report.totals.rejectionRate * 100).toFixed(1) }}%
          </dd>
        </div>
      </dl>
    </header>

    <div class="pipelines-grid">
      <article
        v-for="pipeline in report.pipelines"
        :key="pipeline.name"
        class="pipeline-card"
        :class="pipeline.status !== 'OK' ? 'pipeline-card--error' : 'pipeline-card--ok'"
      >
        <header class="pipeline-card__header">
          <h3 class="pipeline-card__name">{{ pipeline.name }}</h3>
          <span
            class="status-badge"
            :class="pipeline.status === 'OK' ? 'status-badge--ok' : 'status-badge--error'"
            :aria-label="`Statut : ${pipeline.status}`"
          >
            {{ pipeline.status }}
          </span>
        </header>

        <dl class="pipeline-stats">
          <div class="stat-row">
            <dt>Lus</dt>
            <dd>{{ pipeline.rowsRead.toLocaleString('fr-FR') }}</dd>
          </div>
          <div class="stat-row">
            <dt>Insérés</dt>
            <dd>{{ pipeline.rowsInserted.toLocaleString('fr-FR') }}</dd>
          </div>
          <div class="stat-row">
            <dt>Rejetés</dt>
            <dd :class="pipeline.rowsRejected > 0 ? 'text-warn' : ''">
              {{ pipeline.rowsRejected.toLocaleString('fr-FR') }}
            </dd>
          </div>
          <div class="stat-row">
            <dt>Taux de rejet</dt>
            <dd :class="pipeline.rejectionRate > 0.05 ? 'text-warn' : 'text-ok'">
              {{ (pipeline.rejectionRate * 100).toFixed(1) }}%
            </dd>
          </div>
          <div class="stat-row">
            <dt>Durée</dt>
            <dd>{{ pipeline.durationS.toFixed(2) }}s</dd>
          </div>
        </dl>

        <div v-if="Object.keys(pipeline.topRejectionReasons).length > 0" class="rejection-reasons">
          <p class="rejection-reasons__label">Raisons de rejet :</p>
          <ul class="rejection-reasons__list">
            <li v-for="(count, reason) in pipeline.topRejectionReasons" :key="reason">
              {{ reason }}
              <span class="rejection-count">{{ count }}</span>
            </li>
          </ul>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { EtlReport } from '@/types'

defineProps<{ report: EtlReport }>()
</script>

<style scoped>
.etl-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.etl-section__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.5rem;
  flex-wrap: wrap;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--radius);
  padding: 1.25rem 1.5rem;
  box-shadow: var(--shadow-sm);
}

.section-title {
  margin: 0 0 0.25rem;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--c-text);
}

.section-subtitle {
  margin: 0;
  font-size: 0.875rem;
  color: var(--c-text-muted);
}

.etl-totals {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
  margin: 0;
}

.etl-total {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.125rem;
}

.etl-total dt {
  font-size: 0.75rem;
  color: var(--c-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.etl-total dd {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--c-text);
  font-variant-numeric: tabular-nums;
}

.etl-total > .etl-total--ok { color: var(--c-brand); }
.etl-total > .etl-total--warn { color: var(--c-energy); }
dd.etl-total--ok { color: var(--c-brand); }
dd.etl-total--warn { color: var(--c-energy); }

.pipelines-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.pipeline-card {
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--radius);
  padding: 1.25rem;
  box-shadow: var(--shadow-sm);
  border-left: 4px solid transparent;
}

.pipeline-card--ok { border-left-color: var(--c-brand); }
.pipeline-card--error { border-left-color: var(--c-danger); background: var(--c-surface-2); }

.pipeline-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.pipeline-card__name {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--c-text);
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-badge {
  padding: 0.2rem 0.65rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  flex-shrink: 0;
}

.status-badge--ok { background: var(--c-brand-xlight); color: var(--c-brand); }
.status-badge--error { background: var(--c-danger-light); color: var(--c-danger); }

.pipeline-stats {
  margin: 0 0 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-row dt {
  font-size: 0.8125rem;
  color: var(--c-text-muted);
}

.stat-row dd {
  margin: 0;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--c-text);
  font-variant-numeric: tabular-nums;
}

.text-ok { color: var(--c-brand); }
.text-warn { color: var(--c-energy); }

.rejection-reasons {
  border-top: 1px solid var(--c-border);
  padding-top: 0.75rem;
}

.rejection-reasons__label {
  margin: 0 0 0.5rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--c-text-muted);
}

.rejection-reasons__list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.rejection-reasons__list li {
  display: flex;
  justify-content: space-between;
  font-size: 0.8125rem;
  color: var(--c-text);
}

.rejection-count {
  font-weight: 700;
  color: var(--c-energy);
}
</style>
