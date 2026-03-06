import { hexToRgba } from '../chartTheme'
import {
  asArray,
  createBaseCartesianOption,
  createCategoryXAxis,
  createValueYAxis,
  resolveSeriesColor,
  resolveSeriesName,
} from './common'

export const buildLineOption = (definition) => {
  const labels = asArray(definition?.labels)
  const datasets = asArray(definition?.datasets)

  return {
    ...createBaseCartesianOption(),
    xAxis: createCategoryXAxis(labels, definition?.meta?.xAxisLabel),
    yAxis: createValueYAxis(definition?.meta?.yAxisLabel),
    series: datasets.map((dataset, index) => {
      const color = resolveSeriesColor(dataset, index)
      return {
        name: resolveSeriesName(dataset, index),
        type: 'line',
        data: asArray(dataset?.data),
        showSymbol: true,
        symbol: 'circle',
        symbolSize: 7,
        smooth: false,
        itemStyle: { color },
        lineStyle: { color, width: 2 },
        areaStyle: { color: hexToRgba(color, 0.2) },
      }
    }),
  }
}
