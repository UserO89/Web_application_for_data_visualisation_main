const readStats = (statsByColumnId, columnId) => statsByColumnId.get(Number(columnId))?.statistics || {}

const normalizePercent = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return null
  if (value > 1) return value
  return value * 100
}

export const normalizeFrequencyRows = (source) => {
  if (!source) return []

  if (Array.isArray(source)) {
    return source
      .map((entry) => {
        if (!entry || typeof entry !== 'object') return null
        const count = Number(entry.count)
        return {
          value: entry.value ?? entry.period ?? 'Unknown',
          count: Number.isFinite(count) ? count : 0,
          percent: normalizePercent(entry.percent),
        }
      })
      .filter(Boolean)
  }

  if (typeof source === 'object') {
    return Object.entries(source).map(([value, count]) => ({
      value,
      count: Number.isFinite(Number(count)) ? Number(count) : 0,
      percent: null,
    }))
  }

  return []
}

export const buildNumericMatrix = ({ columns, metricKeys, statsByColumnId }) => ({
  columns: columns || [],
  metricKeys: metricKeys || [],
  rows: expandNumericMetricKeys(metricKeys || []).map((metricKey) => ({
    key: metricKey,
    values: (columns || []).map((column) => ({
      columnId: column.id,
      value: readNumericMetricValue(readStats(statsByColumnId, column.id), metricKey),
    })),
  })),
})

const expandNumericMetricKeys = (metricKeys) =>
  (metricKeys || []).flatMap((metricKey) => {
    if (metricKey === 'quartiles') return ['q1', 'q2', 'q3']
    return [metricKey]
  })

const readNumericMetricValue = (stats, metricKey) => {
  if (!stats || typeof stats !== 'object') return null
  if (metricKey === 'q1' || metricKey === 'q2' || metricKey === 'q3') {
    return stats.quartiles?.[metricKey] ?? null
  }
  return stats[metricKey]
}

export const buildCategorySummaries = ({ columns, metricKeys, statsByColumnId }) =>
  (columns || []).map((column) => {
    const stats = readStats(statsByColumnId, column.id)
    const showFrequency = (metricKeys || []).includes('frequency')

    return {
      columnId: column.id,
      columnName: column.name,
      count: (metricKeys || []).includes('count') ? stats.count : null,
      distinctCount: (metricKeys || []).includes('distinct_count') ? stats.distinct_count : null,
      mode: (metricKeys || []).includes('mode') ? stats.mode : null,
      frequencyRows: showFrequency
        ? normalizeFrequencyRows(stats.frequency || stats.top_categories).slice(0, 12)
        : [],
      showFrequency,
    }
  })

export const buildDateSummaries = ({ columns, metricKeys, statsByColumnId }) =>
  (columns || []).map((column) => {
    const stats = readStats(statsByColumnId, column.id)
    return {
      columnId: column.id,
      columnName: column.name,
      count: (metricKeys || []).includes('count') ? stats.count : null,
      earliest: (metricKeys || []).includes('earliest') ? stats.earliest : null,
      latest: (metricKeys || []).includes('latest') ? stats.latest : null,
      rangeSeconds: (metricKeys || []).includes('range_seconds') ? stats.range_seconds : null,
    }
  })

export const buildOrderedSummaries = ({ columns, metricKeys, statsByColumnId }) =>
  (columns || []).map((column) => {
    const stats = readStats(statsByColumnId, column.id)
    const showFrequency = (metricKeys || []).includes('frequency')

    return {
      columnId: column.id,
      columnName: column.name,
      count: (metricKeys || []).includes('count') ? stats.count : null,
      mode: (metricKeys || []).includes('mode') ? stats.mode : null,
      medianRank: (metricKeys || []).includes('median_rank') ? stats.median_rank : null,
      medianRankLabel: (metricKeys || []).includes('median_rank') ? stats.median_rank_label : null,
      frequencyRows: showFrequency
        ? normalizeFrequencyRows(stats.frequency || stats.top_categories).slice(0, 12)
        : [],
      showFrequency,
    }
  })
