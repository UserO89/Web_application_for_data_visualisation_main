<template>
  <div
    v-if="isOpen && importValidation"
    class="validation-modal-backdrop"
    @click.self="$emit('close')"
  >
    <div class="validation-modal panel" role="dialog" aria-modal="true" aria-label="Import review">
      <div class="validation-head">
        <div class="validation-title">Import Review</div>
        <div class="validation-actions">
          <button type="button" class="btn" @click="$emit('clear')">Clear Report</button>
          <button type="button" class="btn" @click="$emit('close')">Close</button>
        </div>
      </div>

      <div class="validation-summary-line">
        {{ validationSummaryLine }}
      </div>

      <div class="validation-summary-grid">
        <div class="summary-item">
          <span class="summary-label">Rows imported</span>
          <strong class="summary-value">{{ reviewSummary.rows_imported }}</strong>
        </div>
        <div class="summary-item">
          <span class="summary-label">Rows skipped</span>
          <strong class="summary-value">{{ reviewSummary.rows_skipped }}</strong>
        </div>
        <div class="summary-item">
          <span class="summary-label">Problematic columns</span>
          <strong class="summary-value">{{ reviewSummary.problematic_columns }}</strong>
        </div>
        <div class="summary-item">
          <span class="summary-label">Normalized values</span>
          <strong class="summary-value">{{ reviewSummary.normalized_cells }}</strong>
        </div>
        <div class="summary-item">
          <span class="summary-label">May become null</span>
          <strong class="summary-value">{{ reviewSummary.nullified_cells }}</strong>
        </div>
      </div>

      <div class="validation-columns">
        <div class="section-title">Problematic Columns</div>

        <div v-if="validationProblemColumns?.length" class="column-list">
          <article
            v-for="column in validationProblemColumns"
            :key="`problem-column-${column.column_name}`"
            class="column-card"
          >
            <div class="column-head">
              <div>
                <div class="column-name">{{ column.column_name }}</div>
                <div class="column-meta">
                  {{ column.issue_count || 0 }} problematic value{{ (column.issue_count || 0) === 1 ? '' : 's' }}
                </div>
              </div>
              <div class="column-index">#{{ column.column_index || '-' }}</div>
            </div>

            <div class="column-counters">
              <span class="counter-chip">Normalized: {{ column.normalized_count || 0 }}</span>
              <span class="counter-chip nullified">Nullified: {{ column.nullified_count || 0 }}</span>
            </div>

            <div v-if="getVisibleSamples(column).length" class="table-wrap samples-wrap">
              <table class="data-table samples-table">
                <thead>
                  <tr>
                    <th>Row</th>
                    <th>Original value</th>
                    <th>Action</th>
                    <th>Result</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="sample in getVisibleSamples(column)"
                    :key="`sample-${column.column_name}-${sample.row}-${sample.original_value}-${sample.new_value}`"
                  >
                    <td>{{ sample.row }}</td>
                    <td>{{ formatIssueValue(sample.original_value) }}</td>
                    <td>
                      <span :class="['action-badge', sample.action === 'nullified' ? 'action-nullified' : 'action-normalized']">
                        {{ sample.action === 'nullified' ? 'nullified' : 'normalized' }}
                      </span>
                    </td>
                    <td>{{ formatIssueValue(sample.new_value) }}</td>
                    <td>{{ sample.reason }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else class="column-empty">
              No reviewable samples for this column.
            </div>
          </article>
        </div>
        <div v-else class="validation-summary-empty">No problematic columns found.</div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ProjectValidationModal',
  props: {
    isOpen: { type: Boolean, default: false },
    importValidation: { type: Object, default: null },
    validationSummaryLine: { type: String, default: '' },
    validationSummary: { type: Object, default: () => ({}) },
    validationProblemColumns: { type: Array, default: () => [] },
    formatIssueValue: { type: Function, default: (value) => String(value ?? '') },
  },
  emits: ['close', 'clear'],
  computed: {
    reviewSummary() {
      return {
        rows_imported: Number(this.validationSummary?.rows_imported ?? 0),
        rows_skipped: Number(this.validationSummary?.rows_skipped ?? 0),
        problematic_columns: Number(this.validationSummary?.problematic_columns ?? 0),
        normalized_cells: Number(this.validationSummary?.normalized_cells ?? 0),
        nullified_cells: Number(this.validationSummary?.nullified_cells ?? 0),
      }
    },
  },
  methods: {
    getVisibleSamples(column) {
      const samples = Array.isArray(column?.review_samples) ? column.review_samples : []
      return samples.filter((sample) => {
        if (Number(sample?.row || 0) <= 0) return false
        const reason = String(sample?.reason || '').toLowerCase()
        if (reason.includes('empty marker')) return false
        return true
      })
    },
  },
}
</script>

<style scoped>
.validation-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 60;
  background: rgba(0, 0, 0, 0.62);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
}
.validation-modal {
  width: min(860px, 94vw);
  max-height: 84vh;
  overflow: auto;
}
.validation-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 8px; }
.validation-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.validation-title { font-size: 15px; font-weight: 700; color: #93f6b3; }
.validation-summary-line { color: var(--muted); font-size: 13px; line-height: 1.45; margin-bottom: 8px; }
.validation-summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 8px;
}
.summary-item {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 8px 10px;
  background: #161616;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.summary-label { color: var(--muted); font-size: 11px; }
.summary-value { color: var(--text); font-size: 16px; }
.validation-columns { margin-top: 14px; display: flex; flex-direction: column; gap: 10px; }
.section-title { font-size: 12px; font-weight: 700; color: var(--muted); }
.column-list { display: flex; flex-direction: column; gap: 10px; }
.column-card {
  border: 1px solid var(--border);
  border-radius: 12px;
  background: #161616;
  padding: 10px;
}
.column-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
.column-name { font-weight: 700; color: var(--text); }
.column-meta { color: var(--muted); font-size: 12px; margin-top: 2px; }
.column-index {
  color: var(--muted);
  font-size: 11px;
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 2px 7px;
}
.column-counters { margin-top: 8px; display: flex; gap: 8px; flex-wrap: wrap; }
.counter-chip {
  font-size: 11px;
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 2px 8px;
}
.counter-chip.nullified {
  border-color: rgba(245, 158, 11, 0.45);
  color: #fbbf24;
}
.samples-wrap { margin-top: 8px; }
.samples-table { min-width: 700px; }
.action-badge {
  font-size: 10px;
  border-radius: 999px;
  padding: 2px 6px;
  text-transform: lowercase;
}
.action-normalized {
  border: 1px solid rgba(34, 197, 94, 0.45);
  color: #86efac;
}
.action-nullified {
  border: 1px solid rgba(245, 158, 11, 0.45);
  color: #fbbf24;
}
.column-empty,
.validation-summary-empty {
  color: var(--muted);
  font-size: 12px;
  margin-top: 8px;
}
</style>
