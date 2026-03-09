<template>
  <div
    v-if="isOpen && importValidation"
    class="validation-modal-backdrop"
    @click.self="$emit('close')"
  >
    <div class="validation-modal panel" role="dialog" aria-modal="true" aria-label="Data validation report">
      <div class="validation-head">
        <div class="validation-title">Data Validation Report</div>
        <div class="validation-actions">
          <button type="button" class="btn" @click="$emit('clear')">Clear Report</button>
          <button type="button" class="btn" @click="$emit('close')">Close</button>
        </div>
      </div>

      <div class="validation-summary">
        {{ validationSummaryLine }}
      </div>
      <div class="validation-summary validation-severity-line">
        Errors: {{ validationSummary?.error_count || 0 }},
        warnings: {{ validationSummary?.warning_count || 0 }},
        info: {{ validationSummary?.info_count || 0 }}.
      </div>

      <div v-if="importValidation?.issues?.length" class="validation-groups">
        <div v-for="severity in severityOrder" :key="`severity-${severity}`" class="validation-group">
          <div v-if="validationIssuesBySeverity?.[severity]?.length" class="validation-group-title">
            {{ severity.toUpperCase() }} ({{ validationIssuesBySeverity[severity].length }})
          </div>
          <div v-if="validationIssuesBySeverity?.[severity]?.length" class="validation-list">
            <div
              v-for="(issue, idx) in validationIssuesBySeverity[severity]"
              :key="`issue-modal-${severity}-${idx}`"
              class="validation-item"
            >
              <div class="validation-item-meta">
                <strong>{{ formatIssueTargetLabel(issue) }}</strong>: {{ issue.message }}
              </div>
              <div class="validation-item-code">{{ issue.code }}</div>
              <div v-if="issue.original !== undefined || issue.fixed !== undefined" class="validation-diff">
                Auto-fix: {{ formatIssueValue(issue.original) }} -> {{ formatIssueValue(issue.fixed) }}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="validation-summary">No issues found.</div>

      <div v-if="validationColumnRows?.length" class="validation-columns">
        <div class="validation-group-title">Column Quality Overview</div>
        <div class="table-wrap validation-columns-wrap">
          <table class="data-table validation-columns-table">
            <thead>
              <tr>
                <th>Column</th>
                <th>Type</th>
                <th>Status</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="column in validationColumnRows" :key="`quality-${column.name}`">
                <td>{{ column.name }}</td>
                <td>{{ column.type }}</td>
                <td>{{ column.status }}</td>
                <td>{{ column.note }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-if="editableValidationIssueCount" class="validation-footer">
        <div class="validation-save-state">{{ validationSaveState || 'Edit values and click save to update table data.' }}</div>
        <button type="button" class="btn primary" :disabled="savingValidation" @click="$emit('save')">
          {{ savingValidation ? 'Saving...' : 'Save Changes' }}
        </button>
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
    severityOrder: { type: Array, default: () => [] },
    validationIssuesBySeverity: { type: Object, default: () => ({}) },
    validationColumnRows: { type: Array, default: () => [] },
    editableValidationIssueCount: { type: Number, default: 0 },
    validationSaveState: { type: String, default: '' },
    savingValidation: { type: Boolean, default: false },
    formatIssueTargetLabel: { type: Function, default: (issue) => String(issue?.message || '') },
    formatIssueValue: { type: Function, default: (value) => String(value ?? '') },
  },
  emits: ['close', 'clear', 'save'],
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
.validation-summary { color: var(--muted); font-size: 13px; line-height: 1.45; }
.validation-severity-line { margin-top: 4px; }
.validation-groups { margin-top: 10px; display: flex; flex-direction: column; gap: 12px; }
.validation-group-title { font-size: 12px; font-weight: 700; color: var(--muted); margin-bottom: 4px; }
.validation-list { display: flex; flex-direction: column; gap: 6px; max-height: 46vh; overflow: auto; padding-right: 4px; }
.validation-item { font-size: 12px; color: var(--text); line-height: 1.45; border: 1px solid var(--border); border-radius: 10px; padding: 8px; background: #161616; }
.validation-item-meta { margin-bottom: 4px; }
.validation-item-code { color: var(--muted); font-size: 11px; margin-bottom: 4px; }
.validation-diff { color: #93f6b3; }
.validation-columns { margin-top: 12px; }
.validation-columns-wrap { max-height: 240px; }
.validation-columns-table { min-width: 680px; }
.validation-footer { margin-top: 10px; display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap; }
.validation-save-state { color: var(--muted); font-size: 12px; }
</style>
