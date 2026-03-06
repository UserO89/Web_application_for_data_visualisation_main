const BASE_STATS = ['count', 'non_null_count', 'null_count', 'distinct_count']

export const STATISTICS_RULES = {
  metric: [
    ...BASE_STATS,
    'mean',
    'median',
    'min',
    'max',
    'quartiles',
    'range',
    'std_dev',
    'variance',
    'iqr',
  ],
  nominal: [
    ...BASE_STATS,
    'mode',
    'frequency',
    'top_categories',
  ],
  ordinal: [
    ...BASE_STATS,
    'mode',
    'frequency',
    'median_rank',
    'median_rank_label',
  ],
  temporal: [
    ...BASE_STATS,
    'earliest',
    'latest',
    'range_seconds',
    'granularity',
    'frequency_by_period',
  ],
  binary: [
    ...BASE_STATS,
    'mode',
    'frequency',
    'top_categories',
  ],
  identifier: [...BASE_STATS],
  ignored: [...BASE_STATS],
}

export const getAvailableStatistics = (semanticType) =>
  STATISTICS_RULES[semanticType] || BASE_STATS
