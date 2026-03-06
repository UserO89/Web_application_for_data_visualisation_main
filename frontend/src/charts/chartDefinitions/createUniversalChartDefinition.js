import { normalizeChartDefinition } from '../rules/chartDefinitionValidator'

export const createDefaultChartDefinition = (chartType = 'line') =>
  normalizeChartDefinition({
    chartType,
    bindings: {
      x: null,
      y: { field: null, aggregation: chartType === 'scatter' ? 'none' : 'sum' },
      group: null,
      value: { field: null, aggregation: chartType === 'pie' ? 'count' : 'none' },
      category: null,
    },
    settings: {},
    filters: [],
    sort: null,
  })

export const mergeChartDefinition = (baseDefinition, incomingDefinition) =>
  normalizeChartDefinition({
    ...baseDefinition,
    ...(incomingDefinition || {}),
    bindings: {
      ...(baseDefinition?.bindings || {}),
      ...(incomingDefinition?.bindings || {}),
      y: {
        ...(baseDefinition?.bindings?.y || {}),
        ...(incomingDefinition?.bindings?.y || {}),
      },
      value: {
        ...(baseDefinition?.bindings?.value || {}),
        ...(incomingDefinition?.bindings?.value || {}),
      },
    },
    settings: {
      ...(baseDefinition?.settings || {}),
      ...(incomingDefinition?.settings || {}),
    },
  })
