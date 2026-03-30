<template>
  <div class="results-block">
    <div class="results-head">
      <div class="stats-group-title">Numeric statistics</div>
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
      Select at least one numeric column and one numeric measure to see numeric statistics.
    </div>
    <div v-else-if="!selectedNumericMetricKeys.length" class="muted">
      Select at least one numeric measure to see numeric statistics.
    </div>
    <div v-else class="table-wrap">
      <table class="data-table stats-table">
        <thead>
          <tr>
            <th>Measure</th>
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
      <div class="stats-group-title">Category summaries</div>
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
      Select at least one category column to see category summaries.
    </div>
    <div v-else-if="!selectedCategoryMetricKeys.length" class="muted">
      Select at least one category measure to see category summaries.
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
          Distinct categories: <strong>{{ formatValue(summary.distinctCount) }}</strong>
        </div>
        <div v-if="hasValue(summary.mode)" class="summary-line">
          Most frequent value: <strong>{{ formatValue(summary.mode) }}</strong>
        </div>
        <div v-if="hasValue(summary.count)" class="summary-line">
          Count: <strong>{{ formatValue(summary.count) }}</strong>
        </div>

        <div v-if="summary.showFrequency" class="summary-frequency">
          <div class="summary-subtitle">Top values</div>
          <div v-if="summary.frequencyRows.length" class="table-wrap compact-wrap">
            <table class="data-table compact-table">
              <thead>
                <tr>
                  <th>Value</th>
                  <th>Count</th>
                  <th>Percent</th>
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
          <div v-else class="muted">No distribution data available.</div>
        </div>
      </article>
    </div>
  </div>

  <div class="results-block">
    <div class="results-head">
      <div class="stats-group-title">Date summaries</div>
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
      Select at least one date column to see date summaries.
    </div>
    <div v-else-if="!selectedDateMetricKeys.length" class="muted">
      Select at least one date measure to see date summaries.
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
          Earliest: <strong>{{ formatValue(summary.earliest) }}</strong>
        </div>
        <div v-if="hasValue(summary.latest)" class="summary-line">
          Latest: <strong>{{ formatValue(summary.latest) }}</strong>
        </div>
        <div v-if="hasValue(summary.rangeSeconds)" class="summary-line">
          Range: <strong>{{ formatRangeSeconds(summary.rangeSeconds) }}</strong>
        </div>
        <div v-if="hasValue(summary.count)" class="summary-line">
          Count: <strong>{{ formatValue(summary.count) }}</strong>
        </div>
      </article>
    </div>
  </div>

  <div class="results-block">
    <div class="results-head">
      <div class="stats-group-title">Ordered summaries</div>
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
      Select at least one ordered column to see ordered summaries.
    </div>
    <div v-else-if="!selectedOrderedMetricKeys.length" class="muted">
      Select at least one ordered measure to see ordered summaries.
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
          Mode: <strong>{{ formatValue(summary.mode) }}</strong>
        </div>
        <div v-if="hasValue(summary.medianRank)" class="summary-line">
          Median rank: <strong>{{ formatValue(summary.medianRank) }}</strong>
          <span v-if="hasValue(summary.medianRankLabel)">({{ formatValue(summary.medianRankLabel) }})</span>
        </div>
        <div v-if="hasValue(summary.count)" class="summary-line">
          Count: <strong>{{ formatValue(summary.count) }}</strong>
        </div>

        <div v-if="summary.showFrequency" class="summary-frequency">
          <div class="summary-subtitle">Top values</div>
          <div v-if="summary.frequencyRows.length" class="table-wrap compact-wrap">
            <table class="data-table compact-table">
              <thead>
                <tr>
                  <th>Value</th>
                  <th>Count</th>
                  <th>Percent</th>
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
          <div v-else class="muted">No distribution data available.</div>
        </div>
      </article>
    </div>
  </div>

  <div class="results-block">
    <div class="results-head">
      <div class="stats-group-title">Grouped statistics</div>
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
      Grouped statistics will appear after you choose a grouping column.
    </div>
    <div v-else-if="!selectedNumericColumns.length" class="muted">
      Select at least one numeric column to see grouped statistics.
    </div>
    <div v-else-if="!groupedSummaryRows.length" class="muted">
      No grouped statistics available for the current selection.
    </div>
    <div v-else class="table-wrap">
      <div class="summary-subtitle">Grouped by {{ groupByColumnName }}</div>
      <table class="data-table stats-table">
        <thead>
          <tr>
            <th>Variable</th>
            <th>Group</th>
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
    metricLabel: { type: Function, default: identity },
    hasValue: { type: Function, default: alwaysTrue },
    formatValue: { type: Function, default: identity },
    formatPercent: { type: Function, default: identity },
    formatRangeSeconds: { type: Function, default: identity },
  },
  data() {
    return {
      copyStatus: {
        numeric: '',
        category: '',
        date: '',
        ordered: '',
        grouped: '',
      },
      copyStatusTimers: {},
    }
  },
  computed: {
    canCopyNumeric() {
      return Boolean(
        this.selectedNumericColumns.length
        && this.selectedNumericMetricKeys.length
        && this.numericMatrix.rows.length
      )
    },
    canCopyCategory() {
      return Boolean(
        this.selectedCategoryColumns.length
        && this.selectedCategoryMetricKeys.length
        && this.categorySummaries.length
      )
    },
    canCopyDate() {
      return Boolean(
        this.selectedDateColumns.length
        && this.selectedDateMetricKeys.length
        && this.dateSummaries.length
      )
    },
    canCopyOrdered() {
      return Boolean(
        this.selectedOrderedColumns.length
        && this.selectedOrderedMetricKeys.length
        && this.orderedSummaries.length
      )
    },
    canCopyGrouped() {
      return Boolean(
        this.groupByColumnId
        && this.selectedNumericColumns.length
        && this.groupedSummaryRows.length
      )
    },
  },
  beforeUnmount() {
    Object.values(this.copyStatusTimers).forEach((timerId) => clearTimeout(timerId))
  },
  methods: {
    summaryCopyKey(group, columnId) {
      return `${group}-column-${columnId}`
    },
    isCopied(blockKey) {
      return this.copyStatus[blockKey] === 'Copied'
    },
    isCopyFailed(blockKey) {
      return this.copyStatus[blockKey] === 'Copy failed'
    },
    copyButtonLabel(blockKey) {
      if (this.isCopied(blockKey)) return 'Copied'
      if (this.isCopyFailed(blockKey)) return 'Copy failed'
      return 'Copy table'
    },
    canCopyCategorySummary(summary) {
      return Boolean(summary && this.buildCategorySummaryCopyText(summary))
    },
    canCopyDateSummary(summary) {
      return Boolean(summary && this.buildDateSummaryCopyText(summary))
    },
    canCopyOrderedSummary(summary) {
      return Boolean(summary && this.buildOrderedSummaryCopyText(summary))
    },
    async copyBlock(blockKey) {
      const text = this.buildCopyText(blockKey)
      if (!text) {
        this.setCopyStatus(blockKey, 'No data to copy')
        return
      }

      const copied = await this.writeToClipboard(text)
      this.setCopyStatus(blockKey, copied ? 'Copied' : 'Copy failed')
    },
    async copySummary(group, summary) {
      const copyKey = this.summaryCopyKey(group, summary?.columnId)
      const text = this.buildSummaryCopyText(group, summary)
      if (!text) {
        this.setCopyStatus(copyKey, 'No data to copy')
        return
      }

      const copied = await this.writeToClipboard(text)
      this.setCopyStatus(copyKey, copied ? 'Copied' : 'Copy failed')
    },
    setCopyStatus(blockKey, message) {
      if (this.copyStatusTimers[blockKey]) {
        clearTimeout(this.copyStatusTimers[blockKey])
      }

      this.copyStatus[blockKey] = message
      this.copyStatusTimers[blockKey] = setTimeout(() => {
        this.copyStatus[blockKey] = ''
        delete this.copyStatusTimers[blockKey]
      }, 1800)
    },
    async writeToClipboard(text) {
      if (
        typeof navigator !== 'undefined'
        && navigator.clipboard
        && typeof navigator.clipboard.writeText === 'function'
      ) {
        try {
          await navigator.clipboard.writeText(text)
          return true
        } catch {
          // Fallback below
        }
      }
      return this.writeToClipboardFallback(text)
    },
    writeToClipboardFallback(text) {
      if (typeof document === 'undefined' || !document.body) return false

      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.setAttribute('readonly', '')
      textarea.style.position = 'fixed'
      textarea.style.left = '-9999px'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.focus()
      textarea.select()

      let copied = false
      try {
        copied = document.execCommand('copy')
      } catch {
        copied = false
      }

      document.body.removeChild(textarea)
      return copied
    },
    buildCopyText(blockKey) {
      if (blockKey === 'numeric') return this.buildNumericCopyText()
      if (blockKey === 'category') return this.buildCategoryCopyText()
      if (blockKey === 'date') return this.buildDateCopyText()
      if (blockKey === 'ordered') return this.buildOrderedCopyText()
      if (blockKey === 'grouped') return this.buildGroupedCopyText()
      return ''
    },
    buildSummaryCopyText(group, summary) {
      if (!summary) return ''
      if (group === 'category') return this.buildCategorySummaryCopyText(summary)
      if (group === 'date') return this.buildDateSummaryCopyText(summary)
      if (group === 'ordered') return this.buildOrderedSummaryCopyText(summary)
      return ''
    },
    buildNumericCopyText() {
      if (!this.canCopyNumeric) return ''
      const headers = ['Measure', ...this.numericMatrix.columns.map((column) => column.name)]
      const rows = this.numericMatrix.rows.map((row) => [
        this.metricLabel(row.key),
        ...row.values.map((cell) => this.formatValue(cell.value)),
      ])
      return this.tableToText(headers, rows)
    },
    buildCategoryCopyText() {
      if (!this.canCopyCategory) return ''

      const includeDistinctCount = this.selectedCategoryMetricKeys.includes('distinct_count')
      const includeMode = this.selectedCategoryMetricKeys.includes('mode')
      const includeCount = this.selectedCategoryMetricKeys.includes('count')
      const includeFrequency = this.selectedCategoryMetricKeys.includes('frequency')

      const headers = ['Column']
      if (includeDistinctCount) headers.push('Distinct categories')
      if (includeMode) headers.push('Most frequent value')
      if (includeCount) headers.push('Count')

      const rows = this.categorySummaries.map((summary) => {
        const row = [summary.columnName]
        if (includeDistinctCount) row.push(this.formatMaybeValue(summary.distinctCount))
        if (includeMode) row.push(this.formatMaybeValue(summary.mode))
        if (includeCount) row.push(this.formatMaybeValue(summary.count))
        return row
      })

      const sections = [this.tableToText(headers, rows)]
      if (includeFrequency) {
        this.categorySummaries.forEach((summary) => {
          sections.push(`Top values: ${this.cleanCell(summary.columnName)}`)
          if (!summary.frequencyRows.length) {
            sections.push('Value\tCount\tPercent')
            sections.push('No distribution data available.\t-\t-')
            return
          }
          const frequencyRows = summary.frequencyRows.map((row) => [
            this.formatValue(row.value),
            this.formatValue(row.count),
            this.hasValue(row.percent) ? this.formatPercent(row.percent) : '-',
          ])
          sections.push(this.tableToText(['Value', 'Count', 'Percent'], frequencyRows))
        })
      }
      return sections.join('\n\n')
    },
    buildCategorySummaryCopyText(summary) {
      if (!summary) return ''

      const includeDistinctCount = this.selectedCategoryMetricKeys.includes('distinct_count')
      const includeMode = this.selectedCategoryMetricKeys.includes('mode')
      const includeCount = this.selectedCategoryMetricKeys.includes('count')
      const includeFrequency = this.selectedCategoryMetricKeys.includes('frequency')

      const metricRows = [['Column', summary.columnName]]
      if (includeDistinctCount && this.hasValue(summary.distinctCount)) {
        metricRows.push(['Distinct categories', this.formatValue(summary.distinctCount)])
      }
      if (includeMode && this.hasValue(summary.mode)) {
        metricRows.push(['Most frequent value', this.formatValue(summary.mode)])
      }
      if (includeCount && this.hasValue(summary.count)) {
        metricRows.push(['Count', this.formatValue(summary.count)])
      }

      const sections = [this.tableToText(['Field', 'Value'], metricRows)]
      if (includeFrequency) {
        sections.push(this.buildFrequencySectionText(summary))
      }
      return sections.filter(Boolean).join('\n\n')
    },
    buildDateCopyText() {
      if (!this.canCopyDate) return ''

      const includeEarliest = this.selectedDateMetricKeys.includes('earliest')
      const includeLatest = this.selectedDateMetricKeys.includes('latest')
      const includeRange = this.selectedDateMetricKeys.includes('range_seconds')
      const includeCount = this.selectedDateMetricKeys.includes('count')

      const headers = ['Column']
      if (includeEarliest) headers.push('Earliest')
      if (includeLatest) headers.push('Latest')
      if (includeRange) headers.push('Range')
      if (includeCount) headers.push('Count')

      const rows = this.dateSummaries.map((summary) => {
        const row = [summary.columnName]
        if (includeEarliest) row.push(this.formatMaybeValue(summary.earliest))
        if (includeLatest) row.push(this.formatMaybeValue(summary.latest))
        if (includeRange) {
          row.push(this.hasValue(summary.rangeSeconds) ? this.formatRangeSeconds(summary.rangeSeconds) : '-')
        }
        if (includeCount) row.push(this.formatMaybeValue(summary.count))
        return row
      })

      return this.tableToText(headers, rows)
    },
    buildDateSummaryCopyText(summary) {
      if (!summary) return ''

      const includeEarliest = this.selectedDateMetricKeys.includes('earliest')
      const includeLatest = this.selectedDateMetricKeys.includes('latest')
      const includeRange = this.selectedDateMetricKeys.includes('range_seconds')
      const includeCount = this.selectedDateMetricKeys.includes('count')

      const metricRows = [['Column', summary.columnName]]
      if (includeEarliest && this.hasValue(summary.earliest)) {
        metricRows.push(['Earliest', this.formatValue(summary.earliest)])
      }
      if (includeLatest && this.hasValue(summary.latest)) {
        metricRows.push(['Latest', this.formatValue(summary.latest)])
      }
      if (includeRange && this.hasValue(summary.rangeSeconds)) {
        metricRows.push(['Range', this.formatRangeSeconds(summary.rangeSeconds)])
      }
      if (includeCount && this.hasValue(summary.count)) {
        metricRows.push(['Count', this.formatValue(summary.count)])
      }

      return this.tableToText(['Field', 'Value'], metricRows)
    },
    buildOrderedCopyText() {
      if (!this.canCopyOrdered) return ''

      const includeMode = this.selectedOrderedMetricKeys.includes('mode')
      const includeMedianRank = this.selectedOrderedMetricKeys.includes('median_rank')
      const includeCount = this.selectedOrderedMetricKeys.includes('count')
      const includeFrequency = this.selectedOrderedMetricKeys.includes('frequency')

      const headers = ['Column']
      if (includeMode) headers.push('Mode')
      if (includeMedianRank) headers.push('Median rank')
      if (includeCount) headers.push('Count')

      const rows = this.orderedSummaries.map((summary) => {
        const row = [summary.columnName]
        if (includeMode) row.push(this.formatMaybeValue(summary.mode))
        if (includeMedianRank) row.push(this.formatMedianRank(summary))
        if (includeCount) row.push(this.formatMaybeValue(summary.count))
        return row
      })

      const sections = [this.tableToText(headers, rows)]
      if (includeFrequency) {
        this.orderedSummaries.forEach((summary) => {
          sections.push(`Top values: ${this.cleanCell(summary.columnName)}`)
          if (!summary.frequencyRows.length) {
            sections.push('Value\tCount\tPercent')
            sections.push('No distribution data available.\t-\t-')
            return
          }
          const frequencyRows = summary.frequencyRows.map((row) => [
            this.formatValue(row.value),
            this.formatValue(row.count),
            this.hasValue(row.percent) ? this.formatPercent(row.percent) : '-',
          ])
          sections.push(this.tableToText(['Value', 'Count', 'Percent'], frequencyRows))
        })
      }
      return sections.join('\n\n')
    },
    buildOrderedSummaryCopyText(summary) {
      if (!summary) return ''

      const includeMode = this.selectedOrderedMetricKeys.includes('mode')
      const includeMedianRank = this.selectedOrderedMetricKeys.includes('median_rank')
      const includeCount = this.selectedOrderedMetricKeys.includes('count')
      const includeFrequency = this.selectedOrderedMetricKeys.includes('frequency')

      const metricRows = [['Column', summary.columnName]]
      if (includeMode && this.hasValue(summary.mode)) {
        metricRows.push(['Mode', this.formatValue(summary.mode)])
      }
      if (includeMedianRank && this.hasValue(summary.medianRank)) {
        metricRows.push(['Median rank', this.formatMedianRank(summary)])
      }
      if (includeCount && this.hasValue(summary.count)) {
        metricRows.push(['Count', this.formatValue(summary.count)])
      }

      const sections = [this.tableToText(['Field', 'Value'], metricRows)]
      if (includeFrequency) {
        sections.push(this.buildFrequencySectionText(summary))
      }
      return sections.filter(Boolean).join('\n\n')
    },
    buildGroupedCopyText() {
      if (!this.canCopyGrouped) return ''
      const headers = ['Variable', 'Group', ...this.groupedMetricKeys.map((metric) => this.metricLabel(metric))]
      const rows = this.groupedSummaryRows.map((row) => [
        row.column,
        row.group,
        ...this.groupedMetricKeys.map((metric) => this.formatValue(row.metrics?.[metric])),
      ])
      return this.tableToText(headers, rows)
    },
    formatMedianRank(summary) {
      if (!this.hasValue(summary.medianRank)) return '-'
      const rank = this.formatValue(summary.medianRank)
      if (!this.hasValue(summary.medianRankLabel)) return rank
      return `${rank} (${this.formatValue(summary.medianRankLabel)})`
    },
    formatMaybeValue(value) {
      return this.hasValue(value) ? this.formatValue(value) : '-'
    },
    buildFrequencySectionText(summary) {
      if (!summary?.frequencyRows?.length) {
        return 'Value\tCount\tPercent\nNo distribution data available.\t-\t-'
      }

      const frequencyRows = summary.frequencyRows.map((row) => [
        this.formatValue(row.value),
        this.formatValue(row.count),
        this.hasValue(row.percent) ? this.formatPercent(row.percent) : '-',
      ])
      return this.tableToText(['Value', 'Count', 'Percent'], frequencyRows)
    },
    tableToText(headers, rows) {
      const headRow = headers.map((cell) => this.cleanCell(cell)).join('\t')
      const bodyRows = rows.map((row) => row.map((cell) => this.cleanCell(cell)).join('\t'))
      return [headRow, ...bodyRows].join('\n')
    },
    cleanCell(value) {
      if (value === null || value === undefined) return '-'
      return String(value).replace(/\r?\n/g, ' ').replace(/\t/g, ' ').trim()
    },
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
