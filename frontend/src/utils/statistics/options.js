export const METRIC_OPTIONS = {
  numeric: [
    { key: 'mean', label: 'Mean' },
    { key: 'median', label: 'Median' },
    { key: 'min', label: 'Min' },
    { key: 'max', label: 'Max' },
    { key: 'q1', label: 'Q1' },
    { key: 'q2', label: 'Q2' },
    { key: 'q3', label: 'Q3' },
    { key: 'std_dev', label: 'Std deviation' },
    { key: 'variance', label: 'Variance' },
    { key: 'range', label: 'Range' },
    { key: 'count', label: 'Count' },
    { key: 'distinct_count', label: 'Distinct count' },
  ],
  category: [
    { key: 'frequency', label: 'Frequency' },
    { key: 'mode', label: 'Mode' },
    { key: 'distinct_count', label: 'Distinct count' },
    { key: 'count', label: 'Count' },
  ],
  date: [
    { key: 'earliest', label: 'Earliest' },
    { key: 'latest', label: 'Latest' },
    { key: 'range_seconds', label: 'Range' },
    { key: 'count', label: 'Count' },
  ],
  ordered: [
    { key: 'frequency', label: 'Frequency' },
    { key: 'mode', label: 'Mode' },
    { key: 'median_rank', label: 'Median rank' },
    { key: 'count', label: 'Count' },
  ],
}

export const DEFAULT_SELECTED_METRICS = {
  numeric: ['mean', 'median', 'min', 'max', 'count'],
  category: ['frequency', 'mode', 'distinct_count'],
  date: ['earliest', 'latest', 'range_seconds'],
  ordered: ['frequency', 'mode', 'median_rank'],
}

export const SEMANTIC_OVERRIDE_OPTIONS = [
  { value: 'metric', label: 'Numeric' },
  { value: 'nominal', label: 'Category' },
  { value: 'ordinal', label: 'Ordered category' },
  { value: 'temporal', label: 'Date/Time' },
  { value: 'identifier', label: 'ID' },
  { value: 'binary', label: 'Category (binary)' },
  { value: 'ignored', label: 'Hidden' },
]

const metricOptionsFlat = [
  ...METRIC_OPTIONS.numeric,
  ...METRIC_OPTIONS.category,
  ...METRIC_OPTIONS.date,
  ...METRIC_OPTIONS.ordered,
]

export const metricLabel = (metricKey) => {
  if (metricKey === 'q1') return 'Q1'
  if (metricKey === 'q2') return 'Q2'
  if (metricKey === 'q3') return 'Q3'
  return metricOptionsFlat.find((item) => item.key === metricKey)?.label || metricKey
}
