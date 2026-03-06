import { CHART_THEME, hexToRgba } from '../chartTheme'
import {
  asArray,
  createBaseCartesianOption,
  createCategoryXAxis,
  createCategoryYAxis,
  createValueXAxis,
  createValueYAxis,
  resolveSeriesColor,
} from './common'

const toFiniteValues = (values) =>
  asArray(values)
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value))

const quantile = (sortedValues, q) => {
  if (!sortedValues.length) return NaN
  if (sortedValues.length === 1) return sortedValues[0]
  const position = (sortedValues.length - 1) * q
  const baseIndex = Math.floor(position)
  const rest = position - baseIndex
  const base = sortedValues[baseIndex]
  const next = sortedValues[baseIndex + 1] ?? base
  return base + rest * (next - base)
}

const buildStatsForSeries = (rawValues) => {
  const values = toFiniteValues(rawValues)
  if (!values.length) return null

  const sorted = [...values].sort((a, b) => a - b)
  const min = sorted[0]
  const max = sorted[sorted.length - 1]
  const q1 = quantile(sorted, 0.25)
  const median = quantile(sorted, 0.5)
  const q3 = quantile(sorted, 0.75)
  const iqr = q3 - q1
  const lowerFence = q1 - 1.5 * iqr
  const upperFence = q3 + 1.5 * iqr
  const outliers = values.filter((value) => value < lowerFence || value > upperFence)
  const mean = values.reduce((acc, value) => acc + value, 0) / values.length

  return { fiveNumber: [min, q1, median, q3, max], outliers, mean }
}

const normalizeBoxplotDefinitions = (definition) => {
  const labels = asArray(definition?.labels)
  const datasets = asArray(definition?.datasets)

  if (datasets.some((dataset) => Array.isArray(dataset?.values))) {
    return datasets.map((dataset, index) => ({
      name: dataset?.label || labels[index] || `Series ${index + 1}`,
      values: asArray(dataset?.values),
      color: resolveSeriesColor(dataset, index),
    }))
  }

  // Backward compatibility for legacy Chart.js shape:
  // { datasets: [{ data: Array<Array<number>>, borderColor: Array<string> }] }
  const groupedValues = asArray(datasets[0]?.data)
  return groupedValues.map((values, index) => ({
    name: labels[index] || `Series ${index + 1}`,
    values: asArray(values),
    color: Array.isArray(datasets[0]?.borderColor)
      ? datasets[0].borderColor[index]
      : resolveSeriesColor(datasets[0], index),
  }))
}

export const buildBoxplotOption = (definition) => {
  const orientation = definition?.meta?.orientation === 'horizontal' ? 'horizontal' : 'vertical'
  const showOutliers = definition?.meta?.showOutliers !== false
  const showMean = Boolean(definition?.meta?.showMean)

  const normalizedSeries = normalizeBoxplotDefinitions(definition)
  const categories = normalizedSeries.map((series) => series.name)

  const computedSeries = normalizedSeries
    .map((series) => {
      const stats = buildStatsForSeries(series.values)
      if (!stats) return null
      return {
        ...series,
        fiveNumber: stats.fiveNumber,
        outliers: stats.outliers,
        mean: stats.mean,
      }
    })
    .filter(Boolean)

  const boxplotData = computedSeries.map((series) => ({
    value: series.fiveNumber,
    itemStyle: {
      color: hexToRgba(series.color, 0.25),
      borderColor: series.color,
      borderWidth: 1.2,
    },
  }))

  const outlierData = computedSeries.flatMap((series, index) => {
    if (!showOutliers) return []
    return series.outliers.map((value) => ({
      value: orientation === 'horizontal' ? [value, index] : [index, value],
      itemStyle: { color: series.color },
    }))
  })

  const meanData = computedSeries.map((series, index) => ({
    value: orientation === 'horizontal' ? [series.mean, index] : [index, series.mean],
    itemStyle: { color: series.color },
  }))

  const option = {
    ...createBaseCartesianOption(),
    tooltip: {
      trigger: 'item',
      backgroundColor: CHART_THEME.tooltipBackground,
      borderWidth: 0,
      textStyle: { color: CHART_THEME.textColor },
    },
    xAxis: orientation === 'horizontal'
      ? createValueXAxis(definition?.meta?.yAxisLabel)
      : createCategoryXAxis(categories, definition?.meta?.xAxisLabel),
    yAxis: orientation === 'horizontal'
      ? createCategoryYAxis(categories, definition?.meta?.xAxisLabel)
      : createValueYAxis(definition?.meta?.yAxisLabel),
    series: [{
      name: 'Distribution',
      type: 'boxplot',
      data: boxplotData,
    }],
  }

  if (outlierData.length) {
    option.series.push({
      name: 'Outliers',
      type: 'scatter',
      data: outlierData,
      symbolSize: 8,
    })
  }

  if (showMean && meanData.length) {
    option.series.push({
      name: 'Mean',
      type: 'scatter',
      data: meanData,
      symbolSize: 9,
    })
  }

  return option
}
