import { getLocale, translate } from '../../i18n'

export const hasValue = (value) => value !== null && value !== undefined

const translateWithFallback = (key, fallback, params = {}) => {
  const translated = translate(key, params)
  return translated && translated !== key ? translated : fallback
}

const formatNumber = (value, options = {}) => Number(value).toLocaleString(getLocale(), options)

export const formatValue = (value) => {
  if (value === null || value === undefined) return '-'
  if (Array.isArray(value)) {
    if (!value.length) return '[]'
    if (typeof value[0] === 'object') {
      return translateWithFallback('statistics.formatters.rowsCount', `${value.length} rows`, {
        count: formatNumber(value.length),
      })
    }
    return value.join(', ')
  }
  if (typeof value === 'object') {
    return Object.entries(value)
      .map(([key, child]) => `${key}: ${formatValue(child)}`)
      .join(', ')
  }
  if (typeof value === 'number') {
    if (Number.isInteger(value)) return formatNumber(value)
    return formatNumber(value, { minimumFractionDigits: 0, maximumFractionDigits: 4 })
  }
  return String(value)
}

export const formatPercent = (value) => {
  if (!Number.isFinite(Number(value))) return '-'
  const numeric = Number(value)
  return `${formatNumber(numeric, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}%`
}

export const formatRangeSeconds = (value) => {
  const seconds = Number(value)
  if (!Number.isFinite(seconds)) return '-'
  if (seconds < 60) {
    return translateWithFallback('statistics.formatters.rangeSeconds', `${Math.round(seconds)} sec`, {
      value: formatNumber(Math.round(seconds)),
    })
  }
  if (seconds < 3600) {
    return translateWithFallback('statistics.formatters.rangeMinutes', `${formatNumber(seconds / 60, { maximumFractionDigits: 1 })} min`, {
      value: formatNumber(seconds / 60, { maximumFractionDigits: 1 }),
    })
  }
  if (seconds < 86400) {
    return translateWithFallback('statistics.formatters.rangeHours', `${formatNumber(seconds / 3600, { maximumFractionDigits: 1 })} h`, {
      value: formatNumber(seconds / 3600, { maximumFractionDigits: 1 }),
    })
  }
  return translateWithFallback('statistics.formatters.rangeDays', `${formatNumber(seconds / 86400, { maximumFractionDigits: 2 })} days`, {
    value: formatNumber(seconds / 86400, { maximumFractionDigits: 2 }),
  })
}

export const formatConfidence = (confidence) => {
  if (typeof confidence !== 'number') {
    return translateWithFallback('statistics.advanced.notAvailable', 'n/a')
  }
  return `${Math.round(confidence * 100)}%`
}
