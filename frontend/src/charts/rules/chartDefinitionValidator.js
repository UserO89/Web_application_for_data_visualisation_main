import { CHART_RULES } from './chartRules'

const DEFAULT_MEASURE_BINDING = { field: null, aggregation: 'sum' }

const defaultSettingsByChartType = (chartType) => {
  if (chartType === 'histogram') {
    return {
      bins: 10,
      densityMode: 'frequency',
      showMeanMarker: false,
      showMedianMarker: false,
    }
  }
  if (chartType === 'boxplot') {
    return {
      orientation: 'vertical',
      showOutliers: true,
      showMean: false,
    }
  }
  return {}
}

const ensureMeasureBinding = (value) => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return {
      field: value.field ?? null,
      aggregation: value.aggregation || 'sum',
    }
  }
  if (value === null || value === undefined) {
    return { ...DEFAULT_MEASURE_BINDING }
  }
  return { field: value, aggregation: 'sum' }
}

export const normalizeChartDefinition = (definition) => {
  const chartType = definition?.chartType || 'line'
  const chartRule = CHART_RULES[chartType] || {}
  const allowedBindingKeys = new Set([
    ...Object.keys(chartRule.required || {}),
    ...Object.keys(chartRule.optional || {}),
  ])
  const bindings = definition?.bindings && typeof definition.bindings === 'object'
    ? definition.bindings
    : {}
  const settings = definition?.settings && typeof definition.settings === 'object'
    ? definition.settings
    : {}

  const defaultSettings = defaultSettingsByChartType(chartType)
  const normalizedSettings = {
    ...defaultSettings,
    ...settings,
  }

  if (chartType === 'histogram') {
    const bins = Number(normalizedSettings.bins)
    normalizedSettings.bins = Number.isFinite(bins) ? Math.min(100, Math.max(3, Math.round(bins))) : 10
    normalizedSettings.densityMode = normalizedSettings.densityMode === 'density' ? 'density' : 'frequency'
    normalizedSettings.showMeanMarker = Boolean(normalizedSettings.showMeanMarker)
    normalizedSettings.showMedianMarker = Boolean(normalizedSettings.showMedianMarker)
  }

  if (chartType === 'boxplot') {
    normalizedSettings.orientation = normalizedSettings.orientation === 'horizontal' ? 'horizontal' : 'vertical'
    normalizedSettings.showOutliers = normalizedSettings.showOutliers !== false
    normalizedSettings.showMean = Boolean(normalizedSettings.showMean)
  }

  const normalizedBindings = {
    x: bindings.x ?? null,
    y: ensureMeasureBinding(bindings.y),
    group: bindings.group ?? null,
    value: ensureMeasureBinding(bindings.value),
    category: bindings.category ?? null,
  }

  // Drop stale/irrelevant bindings when switching chart type or applying suggestions.
  Object.keys(normalizedBindings).forEach((bindingKey) => {
    if (allowedBindingKeys.has(bindingKey)) return

    if (bindingKey === 'y' || bindingKey === 'value') {
      normalizedBindings[bindingKey] = { field: null, aggregation: 'none' }
      return
    }

    normalizedBindings[bindingKey] = null
  })

  return {
    chartType,
    bindings: normalizedBindings,
    settings: normalizedSettings,
    filters: Array.isArray(definition?.filters) ? definition.filters : [],
    sort: definition?.sort || null,
  }
}

const buildColumnMap = (schemaColumns) => {
  const map = new Map()
  ;(schemaColumns || []).forEach((column) => {
    map.set(Number(column.id), column)
  })
  return map
}

const getRuleForBinding = (rule, bindingKey) =>
  rule?.required?.[bindingKey] || rule?.optional?.[bindingKey] || null

const isExcludedColumn = (column) =>
  Boolean(column?.isExcludedFromAnalysis) || column?.analyticalRole === 'excluded' || column?.semanticType === 'ignored'

const validateFieldBinding = ({ definition, bindingKey, bindingRule, isRequired, columnMap }) => {
  const errors = []
  const warnings = []
  const value = definition.bindings[bindingKey]

  if (!value && isRequired) {
    errors.push(`Binding "${bindingKey}" is required.`)
    return { errors, warnings }
  }
  if (!value) {
    return { errors, warnings }
  }

  const columnId = Number(value)
  const column = columnMap.get(columnId)
  if (!column) {
    errors.push(`Binding "${bindingKey}" references an unknown column.`)
    return { errors, warnings }
  }

  if (isExcludedColumn(column)) {
    errors.push(`Column "${column.name}" is excluded from analysis.`)
  }

  if (!bindingRule.semanticTypes.includes(column.semanticType)) {
    errors.push(
      `Binding "${bindingKey}" requires [${bindingRule.semanticTypes.join(', ')}], got "${column.semanticType}" from "${column.name}".`
    )
  }

  return { errors, warnings }
}

const validateMeasureBinding = ({ definition, bindingKey, bindingRule, isRequired, columnMap }) => {
  const errors = []
  const warnings = []
  const binding = ensureMeasureBinding(definition.bindings[bindingKey])
  const aggregation = binding.aggregation || 'sum'

  if (!bindingRule.aggregations.includes(aggregation)) {
    errors.push(`Aggregation "${aggregation}" is not allowed for binding "${bindingKey}".`)
  }

  if (aggregation === 'count') {
    if (!bindingRule.allowCount) {
      errors.push(`Binding "${bindingKey}" does not support count aggregation.`)
    }
    if (binding.field !== null && binding.field !== undefined) {
      warnings.push(`Binding "${bindingKey}" with count aggregation ignores selected field.`)
    }
    return { errors, warnings }
  }

  const hasField = binding.field !== null && binding.field !== undefined
  if (!hasField && isRequired) {
    errors.push(`Binding "${bindingKey}" requires a metric column or count aggregation.`)
    return { errors, warnings }
  }
  if (!hasField) {
    return { errors, warnings }
  }

  const columnId = Number(binding.field)
  const column = columnMap.get(columnId)
  if (!column) {
    errors.push(`Binding "${bindingKey}" references an unknown column.`)
    return { errors, warnings }
  }

  if (isExcludedColumn(column)) {
    errors.push(`Column "${column.name}" is excluded from analysis.`)
  }

  if (!bindingRule.semanticTypes.includes(column.semanticType)) {
    errors.push(
      `Binding "${bindingKey}" requires [${bindingRule.semanticTypes.join(', ')}], got "${column.semanticType}" from "${column.name}".`
    )
  }

  return { errors, warnings }
}

export const getAllowedColumnsForBinding = (chartType, bindingKey, schemaColumns) => {
  const rule = CHART_RULES[chartType]
  const bindingRule = getRuleForBinding(rule, bindingKey)
  if (!bindingRule) return []

  return (schemaColumns || []).filter((column) => {
    if (isExcludedColumn(column)) return false
    return bindingRule.semanticTypes.includes(column.semanticType)
  })
}

export const getAllowedAggregations = (chartType, bindingKey) => {
  const rule = CHART_RULES[chartType]
  const bindingRule = getRuleForBinding(rule, bindingKey)
  if (!bindingRule || bindingRule.kind !== 'measure') return []
  return bindingRule.aggregations
}

export const validateChartDefinition = (definition, schemaColumns) => {
  const normalized = normalizeChartDefinition(definition)
  const chartType = normalized.chartType
  const rule = CHART_RULES[chartType]
  const errors = []
  const warnings = []

  if (!rule) {
    return {
      valid: false,
      errors: [`Unsupported chart type "${chartType}".`],
      warnings: [],
      normalizedDefinition: normalized,
    }
  }

  const columnMap = buildColumnMap(schemaColumns)
  const requiredBindings = Object.entries(rule.required || {})
  const optionalBindings = Object.entries(rule.optional || {})
  const allowedBindingKeys = new Set([...requiredBindings, ...optionalBindings].map(([key]) => key))

  requiredBindings.forEach(([bindingKey, bindingRule]) => {
    const result = bindingRule.kind === 'measure'
      ? validateMeasureBinding({ definition: normalized, bindingKey, bindingRule, isRequired: true, columnMap })
      : validateFieldBinding({ definition: normalized, bindingKey, bindingRule, isRequired: true, columnMap })
    errors.push(...result.errors)
    warnings.push(...result.warnings)
  })

  optionalBindings.forEach(([bindingKey, bindingRule]) => {
    const value = normalized.bindings[bindingKey]
    const hasValue = bindingRule.kind === 'measure'
      ? Boolean(value?.field) || value?.aggregation === 'count'
      : Boolean(value)
    if (!hasValue) return

    const result = bindingRule.kind === 'measure'
      ? validateMeasureBinding({ definition: normalized, bindingKey, bindingRule, isRequired: false, columnMap })
      : validateFieldBinding({ definition: normalized, bindingKey, bindingRule, isRequired: false, columnMap })
    errors.push(...result.errors)
    warnings.push(...result.warnings)
  })

  Object.keys(normalized.bindings).forEach((bindingKey) => {
    const value = normalized.bindings[bindingKey]
    const isEmpty = typeof value === 'object'
      ? !(value?.field) && value?.aggregation !== 'count'
      : !value
    if (isEmpty) return
    if (!allowedBindingKeys.has(bindingKey)) {
      errors.push(`Binding "${bindingKey}" is not supported for "${chartType}".`)
    }
  })

  if (chartType === 'scatter') {
    const xId = Number(normalized.bindings.x)
    const yId = Number(normalized.bindings.y?.field)
    if (xId && yId && xId === yId) {
      warnings.push('Scatter uses the same metric for X and Y.')
    }
  }

  if (chartType === 'pie') {
    const categoryId = Number(normalized.bindings.category)
    if (categoryId) {
      const categoryColumn = columnMap.get(categoryId)
      if (categoryColumn?.semanticType === 'temporal') {
        errors.push('Pie category cannot be temporal.')
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: Array.from(new Set(warnings)),
    normalizedDefinition: normalized,
  }
}
