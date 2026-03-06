export const AGGREGATION_MODES = ['none', 'sum', 'avg', 'min', 'max', 'median', 'count']

export const CHART_RULES = {
  line: {
    required: {
      x: { kind: 'field', semanticTypes: ['temporal', 'ordinal'] },
      y: { kind: 'measure', semanticTypes: ['metric'], aggregations: ['sum', 'avg', 'min', 'max', 'median'], allowCount: false },
    },
    optional: {
      group: { kind: 'field', semanticTypes: ['nominal'] },
    },
  },
  bar: {
    required: {
      x: { kind: 'field', semanticTypes: ['nominal', 'ordinal'] },
      y: { kind: 'measure', semanticTypes: ['metric'], aggregations: ['sum', 'avg', 'min', 'max', 'median', 'count'], allowCount: true },
    },
    optional: {
      group: { kind: 'field', semanticTypes: ['nominal'] },
    },
  },
  scatter: {
    required: {
      x: { kind: 'field', semanticTypes: ['metric'] },
      y: { kind: 'measure', semanticTypes: ['metric'], aggregations: ['none'], allowCount: false },
    },
    optional: {
      group: { kind: 'field', semanticTypes: ['nominal'] },
    },
  },
  histogram: {
    required: {
      value: { kind: 'measure', semanticTypes: ['metric'], aggregations: ['none'], allowCount: false },
    },
    optional: {},
  },
  boxplot: {
    required: {
      value: { kind: 'measure', semanticTypes: ['metric'], aggregations: ['none'], allowCount: false },
    },
    optional: {
      group: { kind: 'field', semanticTypes: ['nominal', 'ordinal'] },
    },
  },
  pie: {
    required: {
      category: { kind: 'field', semanticTypes: ['nominal'] },
      value: { kind: 'measure', semanticTypes: ['metric'], aggregations: ['sum', 'avg', 'min', 'max', 'median', 'count'], allowCount: true },
    },
    optional: {},
  },
}

export const CHART_TYPE_OPTIONS = Object.keys(CHART_RULES).map((key) => ({
  key,
  label: key.charAt(0).toUpperCase() + key.slice(1),
}))
