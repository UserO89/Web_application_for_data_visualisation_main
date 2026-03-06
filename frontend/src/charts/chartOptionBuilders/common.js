import { CHART_THEME, fallbackColor } from '../chartTheme'

export const asArray = (value) => (Array.isArray(value) ? value : [])

export const resolveSeriesColor = (dataset, index) => {
  if (dataset?.color) return dataset.color
  if (typeof dataset?.borderColor === 'string') return dataset.borderColor
  return fallbackColor(index)
}

export const resolveSeriesName = (dataset, index) => dataset?.label || `Series ${index + 1}`

export const createBaseCartesianOption = () => ({
  animationDuration: 240,
  textStyle: { color: CHART_THEME.textColor },
  grid: { left: 50, right: 24, top: 42, bottom: 42, containLabel: true },
  legend: { top: 4, textStyle: { color: CHART_THEME.textColor } },
  tooltip: {
    trigger: 'axis',
    backgroundColor: CHART_THEME.tooltipBackground,
    borderWidth: 0,
    textStyle: { color: CHART_THEME.textColor },
    axisPointer: { type: 'line' },
  },
})

const axisStyle = {
  axisLine: { lineStyle: { color: CHART_THEME.axisLineColor } },
  axisLabel: { color: CHART_THEME.textColor },
  axisTick: { lineStyle: { color: CHART_THEME.axisLineColor } },
  splitLine: { lineStyle: { color: CHART_THEME.gridColor } },
}

export const createCategoryXAxis = (labels, name = '') => ({
  type: 'category',
  data: asArray(labels),
  name,
  nameTextStyle: { color: CHART_THEME.textColor },
  ...axisStyle,
})

export const createValueXAxis = (name = '') => ({
  type: 'value',
  name,
  nameTextStyle: { color: CHART_THEME.textColor },
  ...axisStyle,
})

export const createValueYAxis = (name = '') => ({
  type: 'value',
  name,
  nameTextStyle: { color: CHART_THEME.textColor },
  ...axisStyle,
})

export const createCategoryYAxis = (labels, name = '') => ({
  type: 'category',
  data: asArray(labels),
  name,
  nameTextStyle: { color: CHART_THEME.textColor },
  ...axisStyle,
})
