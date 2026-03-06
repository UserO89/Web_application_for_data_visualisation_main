export const DEFAULT_CHART_PALETTE = [
  '#1db954', '#35c9a3', '#4cc9f0', '#4895ef', '#4361ee',
  '#3a0ca3', '#b5179e', '#f72585', '#f15bb5', '#ff8fab',
  '#f8961e', '#f9c74f', '#90be6d', '#43aa8b', '#577590',
]

export const CHART_THEME = {
  textColor: '#b3b3b3',
  tooltipBackground: 'rgba(24, 24, 24, 0.95)',
  axisLineColor: 'rgba(255, 255, 255, 0.2)',
  gridColor: 'rgba(255, 255, 255, 0.08)',
}

export const fallbackColor = (index = 0) => {
  const paletteIndex = Math.abs(Number(index) || 0) % DEFAULT_CHART_PALETTE.length
  return DEFAULT_CHART_PALETTE[paletteIndex]
}

export const hexToRgba = (hex, alpha = 1) => {
  const normalized = String(hex || '').replace('#', '')
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return `rgba(29, 185, 84, ${alpha})`
  const int = parseInt(normalized, 16)
  const r = (int >> 16) & 255
  const g = (int >> 8) & 255
  const b = int & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export const buildPieSliceColors = (baseColor, sliceCount, offset = 0) => {
  const size = Math.max(1, Number(sliceCount) || 0)
  const colors = Array.from({ length: size }, (_, index) => fallbackColor(offset + index))
  if (baseColor) colors[0] = baseColor
  return colors
}
