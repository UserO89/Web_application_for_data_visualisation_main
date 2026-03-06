import { CHART_THEME } from '../chartTheme'
import { buildBarOption } from '../chartOptionBuilders/buildBarOption'
import { buildBoxplotOption } from '../chartOptionBuilders/buildBoxplotOption'
import { buildHistogramOption } from '../chartOptionBuilders/buildHistogramOption'
import { buildLineOption } from '../chartOptionBuilders/buildLineOption'
import { buildPieOption } from '../chartOptionBuilders/buildPieOption'
import { buildScatterOption } from '../chartOptionBuilders/buildScatterOption'

const optionBuilders = {
  bar: buildBarOption,
  boxplot: buildBoxplotOption,
  histogram: buildHistogramOption,
  line: buildLineOption,
  pie: buildPieOption,
  scatter: buildScatterOption,
}

const buildFallbackOption = (type) => ({
  animation: false,
  title: {
    text: `Unsupported chart type: ${type}`,
    left: 'center',
    top: 'middle',
    textStyle: {
      color: CHART_THEME.textColor,
      fontSize: 14,
    },
  },
})

export const buildEChartOption = (definition) => {
  const type = definition?.type || 'line'
  const builder = optionBuilders[type]
  if (!builder) {
    // TODO: add a dedicated option builder when introducing new chart types.
    return buildFallbackOption(type)
  }

  return builder(definition)
}
