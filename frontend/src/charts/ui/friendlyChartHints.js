import { getAllowedColumnsForBinding } from '../rules/chartDefinitionValidator'

const hasField = (value) => value !== null && value !== undefined

const isAllowedField = (chartType, bindingKey, fieldId, schemaColumns) => {
  if (!hasField(fieldId)) return false
  const allowed = getAllowedColumnsForBinding(chartType, bindingKey, schemaColumns)
  return allowed.some((column) => Number(column.id) === Number(fieldId))
}

export const getFriendlyBuildHint = (definition, schemaColumns) => {
  const chartType = definition?.chartType || 'line'
  const bindings = definition?.bindings || {}

  if (chartType === 'line') {
    if (!isAllowedField(chartType, 'x', bindings.x, schemaColumns)) return 'Select one date/time or ordered column for X-axis.'
    if (!isAllowedField(chartType, 'y', bindings?.y?.field, schemaColumns)) return 'Select one numeric column for Y-axis.'
    return ''
  }

  if (chartType === 'bar') {
    if (!isAllowedField(chartType, 'x', bindings.x, schemaColumns)) return 'Select one category column.'
    if (bindings?.y?.aggregation !== 'count' && !isAllowedField(chartType, 'y', bindings?.y?.field, schemaColumns)) {
      return 'Select one numeric column for value mode.'
    }
    return ''
  }

  if (chartType === 'scatter') {
    if (!isAllowedField(chartType, 'x', bindings.x, schemaColumns)) return 'Select one numeric column for X-axis.'
    if (!isAllowedField(chartType, 'y', bindings?.y?.field, schemaColumns)) return 'Select one numeric column for Y-axis.'
    return ''
  }

  if (chartType === 'histogram') {
    if (!isAllowedField(chartType, 'value', bindings?.value?.field, schemaColumns)) return 'Select one numeric variable.'
    return ''
  }

  if (chartType === 'boxplot') {
    if (!isAllowedField(chartType, 'value', bindings?.value?.field, schemaColumns)) return 'Select one numeric variable.'
    return ''
  }

  if (chartType === 'pie') {
    if (!isAllowedField(chartType, 'category', bindings?.category, schemaColumns)) return 'Select one category column.'
    if (bindings?.value?.aggregation !== 'count' && !isAllowedField(chartType, 'value', bindings?.value?.field, schemaColumns)) {
      return 'Select one numeric column for pie values.'
    }
    return ''
  }

  return 'Complete required fields to build chart.'
}
