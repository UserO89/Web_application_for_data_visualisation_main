<template>
  <div class="results-block">
    <div class="stats-group-title">Numeric statistics</div>
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
    <div class="stats-group-title">Category summaries</div>
    <div v-if="!selectedCategoryColumns.length" class="muted">
      Select at least one category column to see category summaries.
    </div>
    <div v-else-if="!selectedCategoryMetricKeys.length" class="muted">
      Select at least one category measure to see category summaries.
    </div>
    <div v-else class="summary-grid">
      <article v-for="summary in categorySummaries" :key="`category-summary-${summary.columnId}`" class="summary-card">
        <div class="summary-title">{{ summary.columnName }}</div>
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
    <div class="stats-group-title">Date summaries</div>
    <div v-if="!selectedDateColumns.length" class="muted">
      Select at least one date column to see date summaries.
    </div>
    <div v-else-if="!selectedDateMetricKeys.length" class="muted">
      Select at least one date measure to see date summaries.
    </div>
    <div v-else class="summary-grid">
      <article v-for="summary in dateSummaries" :key="`date-summary-${summary.columnId}`" class="summary-card">
        <div class="summary-title">{{ summary.columnName }}</div>
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
    <div class="stats-group-title">Ordered summaries</div>
    <div v-if="!selectedOrderedColumns.length" class="muted">
      Select at least one ordered column to see ordered summaries.
    </div>
    <div v-else-if="!selectedOrderedMetricKeys.length" class="muted">
      Select at least one ordered measure to see ordered summaries.
    </div>
    <div v-else class="summary-grid">
      <article v-for="summary in orderedSummaries" :key="`ordered-summary-${summary.columnId}`" class="summary-card">
        <div class="summary-title">{{ summary.columnName }}</div>
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
    <div class="stats-group-title">Grouped statistics</div>
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
}
</script>

<style scoped>
.results-block {
  border: 1px solid var(--border);
  border-radius: 10px;
  background: #171717;
  padding: 10px;
}
.stats-group-title { font-size: 13px; font-weight: 700; }
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
.summary-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--text);
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
