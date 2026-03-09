export const defaultSeriesColor = (index = 0, palette = []) => {
  if (!Array.isArray(palette) || !palette.length) return '#000000'
  const normalizedIndex = Math.abs(Number(index) || 0)
  return palette[normalizedIndex % palette.length]
}

export const clampChartViewportHeight = (value, minHeight = 280, maxHeight = 920) => {
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue)) return minHeight

  const min = Number(minHeight)
  const max = Number(maxHeight)
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return Math.round(numericValue)
  }

  const low = Math.min(min, max)
  const high = Math.max(min, max)
  return Math.min(high, Math.max(low, Math.round(numericValue)))
}
