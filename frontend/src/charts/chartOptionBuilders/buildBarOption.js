import { hexToRgba } from '../chartTheme'
import {
  asArray,
  createBaseCartesianOption,
  createCategoryXAxis,
  createValueYAxis,
  resolveSeriesColor,
  resolveSeriesName,
} from './common'

export const buildBarOption = (definition) => {
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
        type: 'bar',
        data: asArray(dataset?.data),
        barMaxWidth: 52,
        itemStyle: {
          color: hexToRgba(color, 0.42),
          borderColor: color,
          borderWidth: 1,
        },
      }
    }),
  }
}
