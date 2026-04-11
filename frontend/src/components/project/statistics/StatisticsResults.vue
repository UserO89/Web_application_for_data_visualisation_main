<template>
  <div class="results-block">
    <div class="results-head">
      <div class="stats-group-title">{{ $t('statistics.results.sections.numeric') }}</div>
      <button
        type="button"
        class="copy-icon-btn"
        :class="{ copied: isCopied('numeric'), failed: isCopyFailed('numeric') }"
        :disabled="!canCopyNumeric"
        :aria-label="copyButtonLabel('numeric')"
        :title="copyButtonLabel('numeric')"
        @click="copyBlock('numeric')"
      >
        <svg v-if="isCopied('numeric')" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 12.5l4.2 4.2L19 7.8" />
        </svg>
        <svg v-else viewBox="0 0 24 24" aria-hidden="true">
          <rect x="9" y="9" width="10" height="10" rx="2" />
          <rect x="5" y="5" width="10" height="10" rx="2" />
        </svg>
      </button>
    </div>
    <div v-if="!selectedNumericColumns.length" class="muted">
      {{ $t('statistics.results.empty.numericSelection') }}
    </div>
    <div v-else-if="!selectedNumericMetricKeys.length" class="muted">
      {{ $t('statistics.results.empty.numericMeasures') }}
    </div>
    <div v-else class="table-wrap">
      <table class="data-table stats-table">
        <thead>
          <tr>
            <th>{{ $t('statistics.results.tables.measure') }}</th>
            <th v-for="column in numericMatrix.columns" :key="`numeric-head-${column.id}`">{{ column.name }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in numericMatrix.rows" :key="`numeric-row-${row.key}`">
            <td>{{ metricLabel(row.key) }}</td>
            <td v-for="cell in row.values" :key="`numeric-cell-${row.key}-${cell.columnId}`">{{ formatValue(cell.value) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="results-block">
    <div class="results-head">
      <div class="stats-group-title">{{ $t('statistics.results.sections.category') }}</div>
      <button
        type="button"
        class="copy-icon-btn"
        :class="{ copied: isCopied('category'), failed: isCopyFailed('category') }"
        :disabled="!canCopyCategory"
        :aria-label="copyButtonLabel('category')"
        :title="copyButtonLabel('category')"
        @click="copyBlock('category')"
      >
        <svg v-if="isCopied('category')" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 12.5l4.2 4.2L19 7.8" />
        </svg>
        <svg v-else viewBox="0 0 24 24" aria-hidden="true">
          <rect x="9" y="9" width="10" height="10" rx="2" />
          <rect x="5" y="5" width="10" height="10" rx="2" />
        </svg>
      </button>
    </div>
    <div v-if="!selectedCategoryColumns.length" class="muted">
      {{ $t('statistics.results.empty.categorySelection') }}
    </div>
    <div v-else-if="!selectedCategoryMetricKeys.length" class="muted">
      {{ $t('statistics.results.empty.categoryMeasures') }}
    </div>
    <div v-else class="summary-grid">
      <article v-for="summary in categorySummaries" :key="`category-summary-${summary.columnId}`" class="summary-card">
        <div class="summary-head">
          <div class="summary-title">{{ summary.columnName }}</div>
          <button
            type="button"
            class="copy-icon-btn summary-copy-btn"
            :class="{
              copied: isCopied(summaryCopyKey('category', summary.columnId)),
              failed: isCopyFailed(summaryCopyKey('category', summary.columnId)),
            }"
            :disabled="!canCopyCategorySummary(summary)"
            :aria-label="copyButtonLabel(summaryCopyKey('category', summary.columnId))"
            :title="copyButtonLabel(summaryCopyKey('category', summary.columnId))"
            @click="copySummary('category', summary)"
          >
            <svg v-if="isCopied(summaryCopyKey('category', summary.columnId))" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 12.5l4.2 4.2L19 7.8" />
            </svg>
            <svg v-else viewBox="0 0 24 24" aria-hidden="true">
              <rect x="9" y="9" width="10" height="10" rx="2" />
              <rect x="5" y="5" width="10" height="10" rx="2" />
            </svg>
          </button>
        </div>
        <div v-if="hasValue(summary.distinctCount)" class="summary-line">
          {{ $t('statistics.results.tables.distinctCategories') }}: <strong>{{ formatValue(summary.distinctCount) }}</strong>
        </div>
        <div v-if="hasValue(summary.mode)" class="summary-line">
          {{ $t('statistics.results.tables.mostFrequentValue') }}: <strong>{{ formatValue(summary.mode) }}</strong>
        </div>
        <div v-if="hasValue(summary.count)" class="summary-line">
          {{ $t('statistics.results.tables.count') }}: <strong>{{ formatValue(summary.count) }}</strong>
        </div>

        <div v-if="summary.showFrequency" class="summary-frequency">
          <div class="summary-subtitle">{{ $t('statistics.results.tables.topValues') }}</div>
          <div v-if="summary.frequencyRows.length" class="table-wrap compact-wrap">
            <table class="data-table compact-table">
              <thead>
                <tr>
                  <th>{{ $t('statistics.results.tables.value') }}</th>
                  <th>{{ $t('statistics.results.tables.count') }}</th>
                  <th>{{ $t('statistics.results.tables.percent') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, rowIndex) in summary.frequencyRows" :key="`category-frequency-${summary.columnId}-${rowIndex}`">
                  <td>{{ formatValue(row.value) }}</td>
                  <td>{{ formatValue(row.count) }}</td>
                  <td>{{ hasValue(row.percent) ? formatPercent(row.percent) : '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="muted">{{ $t('statistics.results.empty.noDistribution') }}</div>
        </div>
      </article>
    </div>
  </div>

  <div class="results-block">
    <div class="results-head">
      <div class="stats-group-title">{{ $t('statistics.results.sections.date') }}</div>
      <button
        type="button"
        class="copy-icon-btn"
        :class="{ copied: isCopied('date'), failed: isCopyFailed('date') }"
        :disabled="!canCopyDate"
        :aria-label="copyButtonLabel('date')"
        :title="copyButtonLabel('date')"
        @click="copyBlock('date')"
      >
        <svg v-if="isCopied('date')" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 12.5l4.2 4.2L19 7.8" />
        </svg>
        <svg v-else viewBox="0 0 24 24" aria-hidden="true">
          <rect x="9" y="9" width="10" height="10" rx="2" />
          <rect x="5" y="5" width="10" height="10" rx="2" />
        </svg>
      </button>
    </div>
    <div v-if="!selectedDateColumns.length" class="muted">
      {{ $t('statistics.results.empty.dateSelection') }}
    </div>
    <div v-else-if="!selectedDateMetricKeys.length" class="muted">
      {{ $t('statistics.results.empty.dateMeasures') }}
    </div>
    <div v-else class="summary-grid">
      <article v-for="summary in dateSummaries" :key="`date-summary-${summary.columnId}`" class="summary-card">
        <div class="summary-head">
          <div class="summary-title">{{ summary.columnName }}</div>
          <button
            type="button"
            class="copy-icon-btn summary-copy-btn"
            :class="{
              copied: isCopied(summaryCopyKey('date', summary.columnId)),
              failed: isCopyFailed(summaryCopyKey('date', summary.columnId)),
            }"
            :disabled="!canCopyDateSummary(summary)"
            :aria-label="copyButtonLabel(summaryCopyKey('date', summary.columnId))"
            :title="copyButtonLabel(summaryCopyKey('date', summary.columnId))"
            @click="copySummary('date', summary)"
          >
            <svg v-if="isCopied(summaryCopyKey('date', summary.columnId))" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 12.5l4.2 4.2L19 7.8" />
            </svg>
            <svg v-else viewBox="0 0 24 24" aria-hidden="true">
              <rect x="9" y="9" width="10" height="10" rx="2" />
              <rect x="5" y="5" width="10" height="10" rx="2" />
            </svg>
          </button>
        </div>
        <div v-if="hasValue(summary.earliest)" class="summary-line">
          {{ $t('statistics.results.tables.earliest') }}: <strong>{{ formatValue(summary.earliest) }}</strong>
        </div>
        <div v-if="hasValue(summary.latest)" class="summary-line">
          {{ $t('statistics.results.tables.latest') }}: <strong>{{ formatValue(summary.latest) }}</strong>
        </div>
        <div v-if="hasValue(summary.rangeSeconds)" class="summary-line">
          {{ $t('statistics.results.tables.range') }}: <strong>{{ formatRangeSeconds(summary.rangeSeconds) }}</strong>
        </div>
        <div v-if="hasValue(summary.count)" class="summary-line">
          {{ $t('statistics.results.tables.count') }}: <strong>{{ formatValue(summary.count) }}</strong>
        </div>
      </article>
    </div>
  </div>

  <div class="results-block">
    <div class="results-head">
      <div class="stats-group-title">{{ $t('statistics.results.sections.ordered') }}</div>
      <button
        type="button"
        class="copy-icon-btn"
        :class="{ copied: isCopied('ordered'), failed: isCopyFailed('ordered') }"
        :disabled="!canCopyOrdered"
        :aria-label="copyButtonLabel('ordered')"
        :title="copyButtonLabel('ordered')"
        @click="copyBlock('ordered')"
      >
        <svg v-if="isCopied('ordered')" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 12.5l4.2 4.2L19 7.8" />
        </svg>
        <svg v-else viewBox="0 0 24 24" aria-hidden="true">
          <rect x="9" y="9" width="10" height="10" rx="2" />
          <rect x="5" y="5" width="10" height="10" rx="2" />
        </svg>
      </button>
    </div>
    <div v-if="!selectedOrderedColumns.length" class="muted">
      {{ $t('statistics.results.empty.orderedSelection') }}
    </div>
    <div v-else-if="!selectedOrderedMetricKeys.length" class="muted">
      {{ $t('statistics.results.empty.orderedMeasures') }}
    </div>
    <div v-else class="summary-grid">
      <article v-for="summary in orderedSummaries" :key="`ordered-summary-${summary.columnId}`" class="summary-card">
        <div class="summary-head">
          <div class="summary-title">{{ summary.columnName }}</div>
          <button
            type="button"
            class="copy-icon-btn summary-copy-btn"
            :class="{
              copied: isCopied(summaryCopyKey('ordered', summary.columnId)),
              failed: isCopyFailed(summaryCopyKey('ordered', summary.columnId)),
            }"
            :disabled="!canCopyOrderedSummary(summary)"
            :aria-label="copyButtonLabel(summaryCopyKey('ordered', summary.columnId))"
            :title="copyButtonLabel(summaryCopyKey('ordered', summary.columnId))"
            @click="copySummary('ordered', summary)"
          >
            <svg v-if="isCopied(summaryCopyKey('ordered', summary.columnId))" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 12.5l4.2 4.2L19 7.8" />
            </svg>
            <svg v-else viewBox="0 0 24 24" aria-hidden="true">
              <rect x="9" y="9" width="10" height="10" rx="2" />
              <rect x="5" y="5" width="10" height="10" rx="2" />
            </svg>
          </button>
        </div>
        <div v-if="hasValue(summary.mode)" class="summary-line">
          {{ $t('statistics.results.tables.mode') }}: <strong>{{ formatValue(summary.mode) }}</strong>
        </div>
        <div v-if="hasValue(summary.medianRank)" class="summary-line">
          {{ $t('statistics.results.tables.medianRank') }}: <strong>{{ formatValue(summary.medianRank) }}</strong>
          <span v-if="hasValue(summary.medianRankLabel)">({{ formatValue(summary.medianRankLabel) }})</span>
        </div>
        <div v-if="hasValue(summary.count)" class="summary-line">
          {{ $t('statistics.results.tables.count') }}: <strong>{{ formatValue(summary.count) }}</strong>
        </div>

        <div v-if="summary.showFrequency" class="summary-frequency">
          <div class="summary-subtitle">{{ $t('statistics.results.tables.topValues') }}</div>
          <div v-if="summary.frequencyRows.length" class="table-wrap compact-wrap">
            <table class="data-table compact-table">
              <thead>
                <tr>
                  <th>{{ $t('statistics.results.tables.value') }}</th>
                  <th>{{ $t('statistics.results.tables.count') }}</th>
                  <th>{{ $t('statistics.results.tables.percent') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, rowIndex) in summary.frequencyRows" :key="`ordered-frequency-${summary.columnId}-${rowIndex}`">
                  <td>{{ formatValue(row.value) }}</td>
                  <td>{{ formatValue(row.count) }}</td>
                  <td>{{ hasValue(row.percent) ? formatPercent(row.percent) : '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="muted">{{ $t('statistics.results.empty.noDistribution') }}</div>
        </div>
      </article>
    </div>
  </div>

  <div class="results-block">
    <div class="results-head">
      <div class="stats-group-title">{{ $t('statistics.results.sections.grouped') }}</div>
      <button
        type="button"
        class="copy-icon-btn"
        :class="{ copied: isCopied('grouped'), failed: isCopyFailed('grouped') }"
        :disabled="!canCopyGrouped"
        :aria-label="copyButtonLabel('grouped')"
        :title="copyButtonLabel('grouped')"
        @click="copyBlock('grouped')"
      >
        <svg v-if="isCopied('grouped')" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 12.5l4.2 4.2L19 7.8" />
        </svg>
        <svg v-else viewBox="0 0 24 24" aria-hidden="true">
          <rect x="9" y="9" width="10" height="10" rx="2" />
          <rect x="5" y="5" width="10" height="10" rx="2" />
        </svg>
      </button>
    </div>
    <div v-if="!groupByColumnId" class="muted">
      {{ $t('statistics.results.empty.groupedChooseColumn') }}
    </div>
    <div v-else-if="!selectedNumericColumns.length" class="muted">
      {{ $t('statistics.results.empty.groupedNumericSelection') }}
    </div>
    <div v-else-if="groupedSourceLoading" class="muted">
      {{ $t('statistics.results.empty.groupedLoading') }}
    </div>
    <div v-else-if="!groupedSourceReady" class="muted">
      {{ $t('statistics.results.empty.groupedRequiresRows') }}
    </div>
    <div v-else-if="!groupedSummaryRows.length" class="muted">
      {{ $t('statistics.results.empty.groupedUnavailable') }}
    </div>
    <div v-else class="table-wrap">
      <div class="summary-subtitle">{{ $t('statistics.results.groupedBy', { name: groupByColumnName }) }}</div>
      <table class="data-table stats-table">
        <thead>
          <tr>
            <th>{{ $t('statistics.results.tables.variable') }}</th>
            <th>{{ $t('statistics.results.tables.group') }}</th>
            <th v-for="metric in groupedMetricKeys" :key="`grouped-head-${metric}`">{{ metricLabel(metric) }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, index) in groupedSummaryRows" :key="`grouped-row-${index}`">
            <td>{{ row.column }}</td>
            <td>{{ row.group }}</td>
            <td v-for="metric in groupedMetricKeys" :key="`grouped-cell-${index}-${metric}`">{{ formatValue(row.metrics[metric]) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import { useI18n } from 'vue-i18n'
import { useStatisticsResultsCopy } from '../../../composables/project/useStatisticsResultsCopy'

const identity = (value) => value
const alwaysTrue = () => true

export default {
  name: 'StatisticsResults',
  props: {
    selectedNumericColumns: { type: Array, default: () => [] },
    selectedCategoryColumns: { type: Array, default: () => [] },
    selectedDateColumns: { type: Array, default: () => [] },
    selectedOrderedColumns: { type: Array, default: () => [] },
    selectedNumericMetricKeys: { type: Array, default: () => [] },
    selectedCategoryMetricKeys: { type: Array, default: () => [] },
    selectedDateMetricKeys: { type: Array, default: () => [] },
    selectedOrderedMetricKeys: { type: Array, default: () => [] },
    numericMatrix: { type: Object, default: () => ({ columns: [], rows: [] }) },
    categorySummaries: { type: Array, default: () => [] },
    dateSummaries: { type: Array, default: () => [] },
    orderedSummaries: { type: Array, default: () => [] },
    groupedMetricKeys: { type: Array, default: () => [] },
    groupedSummaryRows: { type: Array, default: () => [] },
    groupByColumnId: { type: [Number, String], default: null },
    groupByColumnName: { type: String, default: '' },
    groupedSourceReady: { type: Boolean, default: false },
    groupedSourceLoading: { type: Boolean, default: false },
    metricLabel: { type: Function, default: identity },
    hasValue: { type: Function, default: alwaysTrue },
    formatValue: { type: Function, default: identity },
    formatPercent: { type: Function, default: identity },
    formatRangeSeconds: { type: Function, default: identity },
  },
  setup(props) {
    const { t } = useI18n({ useScope: 'global' })

    return useStatisticsResultsCopy(props, t)
  },
}
</script>

<style scoped>
.results-block {
  border: 1px solid var(--border);
  border-radius: 10px;
  background: #171717;
  padding: 10px;
}
.results-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.stats-group-title { font-size: 13px; font-weight: 700; }
.copy-icon-btn {
  width: 28px;
  height: 28px;
  min-width: 28px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: #1b1b1b;
  color: var(--muted);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: color .15s ease, border-color .15s ease, background .15s ease, transform .1s ease;
}
.copy-icon-btn svg {
  width: 15px;
  height: 15px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.copy-icon-btn:hover:not(:disabled) {
  color: var(--text);
  border-color: #4a4a4a;
  background: #202020;
}
.copy-icon-btn:active:not(:disabled) {
  transform: translateY(1px);
}
.copy-icon-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.copy-icon-btn.copied {
  color: #7cd38b;
  border-color: rgba(124, 211, 139, 0.55);
}
.copy-icon-btn.failed {
  color: #ff9b9b;
  border-color: rgba(255, 155, 155, 0.55);
}
.table-wrap { max-height: 360px; overflow: auto; }
.stats-table { min-width: 640px; }
.summary-grid {
  margin-top: 8px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 10px;
}
.summary-card {
  border: 1px solid var(--border);
  border-radius: 10px;
  background: #1b1b1b;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.summary-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}
.summary-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--text);
}
.summary-copy-btn {
  width: 24px;
  height: 24px;
  min-width: 24px;
  border-radius: 7px;
  margin-left: auto;
}
.summary-copy-btn svg {
  width: 13px;
  height: 13px;
}
.summary-subtitle {
  margin-top: 4px;
  font-size: 12px;
  font-weight: 700;
  color: var(--muted);
}
.summary-line {
  font-size: 12px;
  color: var(--text);
}
.summary-frequency { margin-top: 4px; }
.compact-wrap { max-height: 220px; }
.compact-table { min-width: 340px; }
.muted { color: var(--muted); font-size: 12px; }
</style>
