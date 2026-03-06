import { normalizeChartDefinition } from '../rules/chartDefinitionValidator'

const columnNameById = (schemaColumns, id) =>
  (schemaColumns || []).find((column) => Number(column.id) === Number(id))?.name || 'Unknown'

const metricLabel = (measureBinding, schemaColumns) => {
  const aggregation = measureBinding?.aggregation || 'sum'
  if (aggregation === 'count') return 'count'
  const fieldName = columnNameById(schemaColumns, measureBinding?.field)
  if (aggregation === 'none') return fieldName
  return `${aggregation}(${fieldName})`
}

const buildActionLabel = (definition, schemaColumns) => {
  const chartType = definition?.chartType || 'line'
  const bindings = definition?.bindings || {}

  if (chartType === 'line') {
    return `Line: ${columnNameById(schemaColumns, bindings.x)} vs ${metricLabel(bindings.y, schemaColumns)}`
  }
  if (chartType === 'bar') {
    return `Bar: ${columnNameById(schemaColumns, bindings.x)} by ${metricLabel(bindings.y, schemaColumns)}`
  }
  if (chartType === 'scatter') {
    return `Scatter: ${columnNameById(schemaColumns, bindings.x)} vs ${columnNameById(schemaColumns, bindings?.y?.field)}`
  }
  if (chartType === 'histogram') {
    return `Histogram: ${columnNameById(schemaColumns, bindings?.value?.field)}`
  }
  if (chartType === 'boxplot') {
    const group = bindings.group ? ` by ${columnNameById(schemaColumns, bindings.group)}` : ''
    return `Box plot: ${columnNameById(schemaColumns, bindings?.value?.field)}${group}`
  }
  if (chartType === 'pie') {
    return `Pie: ${columnNameById(schemaColumns, bindings.category)} by ${metricLabel(bindings.value, schemaColumns)}`
  }
  return `${chartType}`
}

export const buildQuickChartActions = (suggestions, schemaColumns) =>
  (suggestions || [])
    .map((suggestion, index) => {
      if (!suggestion?.definition) return null
      const definition = normalizeChartDefinition(suggestion.definition)
      return {
        id: `${definition.chartType}-${index}`,
        label: buildActionLabel(definition, schemaColumns),
        definition,
      }
    })
    .filter(Boolean)
