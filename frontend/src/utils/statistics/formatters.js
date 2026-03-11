export const hasValue = (value) => value !== null && value !== undefined

export const formatValue = (value) => {
  if (value === null || value === undefined) return '-'
  if (Array.isArray(value)) {
    if (!value.length) return '[]'
    if (typeof value[0] === 'object') return `${value.length} rows`
    return value.join(', ')
  }
  if (typeof value === 'object') {
    return Object.entries(value)
      .map(([key, child]) => `${key}: ${formatValue(child)}`)
      .join(', ')
  }
  if (typeof value === 'number') {
    if (Number.isInteger(value)) return value.toLocaleString()
    return value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 })
  }
  return String(value)
}

export const formatPercent = (value) => {
  if (!Number.isFinite(Number(value))) return '-'
  const numeric = Number(value)
  return `${numeric.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}%`
}

export const formatRangeSeconds = (value) => {
  const seconds = Number(value)
  if (!Number.isFinite(seconds)) return '-'
  if (seconds < 60) return `${Math.round(seconds)} sec`
  if (seconds < 3600) return `${(seconds / 60).toLocaleString(undefined, { maximumFractionDigits: 1 })} min`
  if (seconds < 86400) return `${(seconds / 3600).toLocaleString(undefined, { maximumFractionDigits: 1 })} h`
  return `${(seconds / 86400).toLocaleString(undefined, { maximumFractionDigits: 2 })} days`
}

export const formatConfidence = (confidence) => {
  if (typeof confidence !== 'number') return 'n/a'
  return `${Math.round(confidence * 100)}%`
}
