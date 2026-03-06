import { CHART_THEME } from '../chartTheme'
import {
  asArray,
  createBaseCartesianOption,
  createValueXAxis,
  createValueYAxis,
  resolveSeriesColor,
  resolveSeriesName,
} from './common'

const normalizePoints = (points) =>
  asArray(points)
    .map((point) => [Number(point?.x), Number(point?.y)])
    .filter((point) => Number.isFinite(point[0]) && Number.isFinite(point[1]))

export const buildScatterOption = (definition) => {
  const datasets = asArray(definition?.datasets)
  const firstDataset = datasets[0]

  return {
    ...createBaseCartesianOption(),
    tooltip: {
      trigger: 'item',
      backgroundColor: CHART_THEME.tooltipBackground,
      borderWidth: 0,
      textStyle: { color: CHART_THEME.textColor },
    },
    xAxis: createValueXAxis(definition?.meta?.xAxisLabel || firstDataset?.xField || ''),
    yAxis: createValueYAxis(definition?.meta?.yAxisLabel || firstDataset?.yField || ''),
    series: datasets.map((dataset, index) => {
      const color = resolveSeriesColor(dataset, index)
      return {
        name: resolveSeriesName(dataset, index),
        type: 'scatter',
        data: normalizePoints(dataset?.data),
        symbolSize: 10,
        itemStyle: {
          color,
          borderColor: color,
          borderWidth: 1,
        },
      }
    }),
  }
}
