import { buildBarOption } from './buildBarOption'

export const buildHistogramOption = (definition) => {
  const option = buildBarOption(definition)
  return {
    ...option,
    series: (option.series || []).map((series) => ({
      ...series,
      barGap: '0%',
      barCategoryGap: '10%',
    })),
  }
}
