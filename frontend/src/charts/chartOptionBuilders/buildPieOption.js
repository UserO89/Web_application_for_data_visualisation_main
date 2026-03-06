import { CHART_THEME, buildPieSliceColors } from '../chartTheme'
import { asArray, resolveSeriesColor, resolveSeriesName } from './common'

const toNumberOrZero = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const createRingRadius = (index, total) => {
  if (total <= 1) return ['0%', '72%']
  const maxOuter = 78
  const minInner = 12
  const available = maxOuter - minInner
  const ringWidth = Math.max(10, Math.floor(available / total))
  const inner = minInner + index * ringWidth
  const outer = Math.min(maxOuter, inner + ringWidth - 2)
  return [`${inner}%`, `${outer}%`]
}

export const buildPieOption = (definition) => {
  const labels = asArray(definition?.labels)
  const datasets = asArray(definition?.datasets)
  const visibleDatasets = datasets.filter((dataset) => asArray(dataset?.data).length > 0)

  return {
    animationDuration: 240,
    textStyle: { color: CHART_THEME.textColor },
    legend: { top: 4, textStyle: { color: CHART_THEME.textColor } },
    tooltip: {
      trigger: 'item',
      backgroundColor: CHART_THEME.tooltipBackground,
      borderWidth: 0,
      textStyle: { color: CHART_THEME.textColor },
    },
    series: visibleDatasets.map((dataset, index) => {
      const baseColor = resolveSeriesColor(dataset, index)
      const values = labels.map((label, pointIndex) => ({
        name: label,
        value: toNumberOrZero(asArray(dataset?.data)[pointIndex]),
      }))
      const sliceColors = buildPieSliceColors(baseColor, labels.length, index)

      return {
        name: resolveSeriesName(dataset, index),
        type: 'pie',
        radius: createRingRadius(index, visibleDatasets.length),
        center: ['50%', '56%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderColor: '#121212',
          borderWidth: 1,
        },
        label: {
          show: visibleDatasets.length === 1,
          color: CHART_THEME.textColor,
        },
        data: values.map((item, valueIndex) => ({
          ...item,
          itemStyle: { color: sliceColors[valueIndex] },
        })),
      }
    }),
  }
}
