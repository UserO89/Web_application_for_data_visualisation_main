const toCleanString = (value) => {
  if (value === null || value === undefined) return null
  const text = String(value).trim()
  if (!text) return null
  return text
}

const toNumber = (value) => {
  const text = toCleanString(value)
  if (!text) return NaN
  const parsed = Number.parseFloat(text.replace(/\s+/g, '').replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : NaN
}

const quantile = (sortedValues, q) => {
  if (!sortedValues.length) return null
  const position = (sortedValues.length - 1) * q
  const lower = Math.floor(position)
  const upper = Math.ceil(position)
  if (lower === upper) return sortedValues[lower]
  const weight = position - lower
  return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight
}

export const calculateNumericMetrics = (values) => {
  const finite = (values || []).filter((value) => Number.isFinite(value))
  if (!finite.length) {
    return {
      count: 0,
      mean: null,
      median: null,
      q1: null,
      q2: null,
      q3: null,
      min: null,
      max: null,
      range: null,
      std_dev: null,
      variance: null,
    }
  }

  const sorted = [...finite].sort((a, b) => a - b)
  const count = sorted.length
  const mean = sorted.reduce((acc, value) => acc + value, 0) / count
  const median = quantile(sorted, 0.5)
  const q1 = quantile(sorted, 0.25)
  const q2 = median
  const q3 = quantile(sorted, 0.75)
  const min = sorted[0]
  const max = sorted[count - 1]
  const range = max - min
  const variance = sorted.reduce((acc, value) => acc + ((value - mean) ** 2), 0) / count
  const stdDev = Math.sqrt(variance)

  return {
    count,
    mean,
    median,
    q1,
    q2,
    q3,
    min,
    max,
    range,
    std_dev: stdDev,
    variance,
  }
}

export const buildGroupedSummaryRows = ({
  rows = [],
  selectedNumericColumns = [],
  categoryColumn = null,
  groupedMetricKeys = [],
} = {}) => {
  if (!categoryColumn || !selectedNumericColumns.length) return []

  const result = []
  selectedNumericColumns.forEach((numericColumn) => {
    const buckets = new Map()
    rows.forEach((row) => {
      const groupValue = toCleanString(row?.[categoryColumn.fieldKey])
      if (!groupValue) return
      const value = toNumber(row?.[numericColumn.fieldKey])
      if (!Number.isFinite(value)) return

      if (!buckets.has(groupValue)) buckets.set(groupValue, [])
      buckets.get(groupValue).push(value)
    })

    Array.from(buckets.keys()).sort((a, b) => String(a).localeCompare(String(b))).forEach((groupValue) => {
      const values = buckets.get(groupValue) || []
      const metrics = calculateNumericMetrics(values)
      const picked = {}
      groupedMetricKeys.forEach((key) => {
        picked[key] = metrics[key]
      })

      result.push({
        column: numericColumn.name,
        group: groupValue,
        metrics: picked,
      })
    })
  })

  return result
}
