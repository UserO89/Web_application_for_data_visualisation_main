import { mount } from '@vue/test-utils'
import { vi } from 'vitest'
import { withI18n } from '../../support/i18n'

vi.mock('../../../src/components/project/DataTable.vue', async () => {
  const { defineComponent, h } = await import('vue')

  return {
    default: defineComponent({
      name: 'DataTable',
      props: {
        fillHeight: { type: Boolean, default: true },
      },
      emits: ['cell-edited', 'cell-editing-state'],
      setup(props, { emit }) {
        return () => h('button', {
          class: 'data-table-stub',
          'data-fill-height': String(props.fillHeight),
          onClick: () => {
            emit('cell-editing-state', true)
            emit('cell-edited', { row: { id: 1 }, field: 'revenue', value: 250 })
            emit('cell-editing-state', false)
          },
        }, 'Emit cell edit')
      },
    }),
  }
})

vi.mock('../../../src/components/project/ChartPanel.vue', async () => {
  const { defineComponent, h } = await import('vue')

  return {
    default: defineComponent({
      name: 'ChartPanel',
      props: {
        embedded: { type: Boolean, default: false },
        allowSave: { type: Boolean, default: false },
        allowExport: { type: Boolean, default: true },
        allowBuild: { type: Boolean, default: false },
        buildDisabled: { type: Boolean, default: false },
        quickActions: { type: Array, default: () => [] },
        labels: { type: Array, default: () => [] },
        datasets: { type: Array, default: () => [] },
        meta: { type: Object, default: () => ({}) },
        type: { type: String, default: 'line' },
      },
      emits: ['build', 'quick-action', 'save'],
      setup(props, { emit }) {
        return () => h('div', { class: 'chart-panel-stub' }, [
          h('div', { class: 'chart-panel-props' }, JSON.stringify({
            embedded: props.embedded,
            allowSave: props.allowSave,
            allowExport: props.allowExport,
            allowBuild: props.allowBuild,
            buildDisabled: props.buildDisabled,
            quickActions: props.quickActions,
            type: props.type,
          })),
          h('button', { class: 'chart-panel-save', onClick: () => emit('save') }, 'Chart save'),
          props.quickActions.length
            ? h('button', { class: 'chart-panel-quick-action', onClick: () => emit('quick-action', props.quickActions[0]) }, 'Chart quick action')
            : null,
          h('button', { class: 'chart-panel-build', onClick: () => emit('build') }, 'Chart build'),
        ])
      },
    }),
  }
})

vi.mock('../../../src/components/project/ChartBuilder.vue', async () => {
  const { defineComponent, h } = await import('vue')

  return {
    default: defineComponent({
      name: 'ChartBuilder',
      props: {
        modelValue: { type: Object, default: () => ({}) },
        schemaColumns: { type: Array, default: () => [] },
        suggestions: { type: Array, default: () => [] },
      },
      emits: ['build', 'update:modelValue'],
      setup(_, { emit }) {
        return () => h('div', { class: 'chart-builder-stub' }, [
          h('button', {
            class: 'chart-builder-build',
            onClick: () => emit('build', { source: 'builder' }),
          }, 'Builder build'),
          h('button', {
            class: 'chart-builder-update',
            onClick: () => emit('update:modelValue', { chartType: 'bar', bindings: {} }),
          }, 'Builder update'),
        ])
      },
    }),
  }
})

vi.mock('../../../src/components/project/StatisticsWorkspace.vue', async () => {
  const { defineComponent, h } = await import('vue')

  return {
    default: defineComponent({
      name: 'StatisticsWorkspace',
      props: {
        fullPage: { type: Boolean, default: false },
      },
      emits: ['load-rows', 'change-semantic', 'change-ordinal-order'],
      setup(props, { emit }) {
        return () => h('div', {
          class: 'statistics-workspace-stub',
          'data-full-page': String(props.fullPage),
        }, [
          h('button', { class: 'stats-load-rows', onClick: () => emit('load-rows') }, 'Stats load rows'),
          h('button', {
            class: 'stats-change-semantic',
            onClick: () => emit('change-semantic', { columnId: 2, semanticType: 'nominal' }),
          }, 'Stats semantic'),
          h('button', {
            class: 'stats-change-ordinal',
            onClick: () => emit('change-ordinal-order', { columnId: 3, ordinalOrder: ['A', 'B'] }),
          }, 'Stats ordinal'),
        ])
      },
    }),
  }
})

import ProjectWorkspaceCanvas from '../../../src/components/project/ProjectWorkspaceCanvas.vue'

const buildPanelConfig = () => ({
  table: { title: 'Table', subtitle: 'Rows' },
  chart: { title: 'Chart', subtitle: 'Visualization' },
  stats: { title: 'Stats', subtitle: 'Analysis' },
  library: { title: 'Library', subtitle: 'Saved charts' },
})

const buildProps = (overrides = {}) => ({
  viewMode: 'workspace',
  isCompactWorkspace: false,
  workspaceHeight: 760,
  visiblePanelIds: ['table', 'chart', 'stats', 'library'],
  panelConfig: buildPanelConfig(),
  resizeDirs: ['e'],
  panelStyle: (panelId) => ({ left: `${panelId.length * 10}px`, top: '0px', width: '320px', height: '300px' }),
  setWorkspaceRef: () => {},
  setChartViewportRef: () => {},
  tableColumns: [{ title: 'Revenue', field: 'revenue' }],
  tableRows: [{ id: 1, revenue: 100 }],
  chartViewportStyle: { height: '320px' },
  chartViewportPresetValue: '320',
  chartLabels: ['Jan'],
  chartDatasets: [{ label: 'Revenue', data: [100] }],
  chartMeta: { xAxisLabel: 'Month' },
  chartType: 'line',
  chartDefinition: {
    chartType: 'line',
    bindings: {
      x: 1,
      y: { field: 2, aggregation: 'sum' },
      group: null,
      value: { field: null, aggregation: 'none' },
      category: null,
    },
  },
  schemaColumns: [
    { id: 1, name: 'Month', semanticType: 'temporal' },
    { id: 2, name: 'Revenue', semanticType: 'metric' },
    { id: 3, name: 'Region', semanticType: 'nominal' },
  ],
  suggestions: [{
    id: 's1',
    definition: {
      chartType: 'bar',
      bindings: {
        x: 3,
        y: { field: 2, aggregation: 'sum' },
      },
    },
  }],
  statisticsSummary: [{ column: 'Revenue' }],
  statisticsLoading: false,
  statisticsError: '',
  savedCharts: [
    {
      id: 9,
      title: 'Revenue trend',
      type: 'line',
      created_at: '2026-01-01',
      labels: ['Jan'],
      datasets: [{ label: 'Revenue', data: [100] }],
      meta: {},
    },
  ],
  savedChartsLoading: false,
  savedChartsError: '',
  analysisRows: [{ id: 1 }],
  analysisRowsReady: false,
  analysisRowsLoading: false,
  analysisRowsError: '',
  schemaUpdatingColumnId: null,
  getSeriesColor: (label, index) => (label === 'Revenue' && index === 0 ? '#123456' : '#abcdef'),
  readOnly: false,
  tableEditable: true,
  tableSaving: false,
  tableHasUnsavedChanges: true,
  ...overrides,
})

const mountCanvas = (props = {}) =>
  mount(ProjectWorkspaceCanvas, {
    ...withI18n({
      props: buildProps(props),
    }),
  })

describe('ProjectWorkspaceCanvas', () => {
  it('forwards workspace-level table, drag, and resize events', async () => {
    const wrapper = mountCanvas({
      visiblePanelIds: ['table'],
      panelConfig: { table: buildPanelConfig().table },
    })

    const panel = wrapper.find('.workspace-panel')
    await panel.trigger('mousedown')
    expect(wrapper.emitted('bring-to-front')).toEqual([['table']])

    const dragHandle = wrapper.find('.drag-handle')
    await dragHandle.trigger('mousedown', { button: 0 })
    expect(wrapper.emitted('start-drag')).toHaveLength(1)
    expect(wrapper.emitted('start-drag')[0][0].panelId).toBe('table')

    const resizeHandle = wrapper.find('.resize-handle.h-e')
    await resizeHandle.trigger('mousedown', { button: 0 })
    expect(wrapper.emitted('start-resize')).toHaveLength(1)
    expect(wrapper.emitted('start-resize')[0][0]).toMatchObject({
      panelId: 'table',
      dir: 'e',
    })

    await wrapper.find('.data-table-stub').trigger('click')
    expect(wrapper.emitted('cell-edit')).toEqual([
      [{ row: { id: 1 }, field: 'revenue', value: 250 }],
    ])
    expect(wrapper.emitted('table-editing-state')).toEqual([[true], [false]])

    const exportButton = wrapper.findAll('button').find((button) => button.text() === 'Export Table CSV')
    const saveButton = wrapper.findAll('button').find((button) => button.text() === 'Save Table')
    await exportButton.trigger('click')
    await saveButton.trigger('click')
    expect(wrapper.emitted('export-csv')).toHaveLength(1)
    expect(wrapper.emitted('save-table')).toHaveLength(1)
  })

  it('uses natural-height table mode on the standalone table page', () => {
    const wrapper = mountCanvas({
      viewMode: 'table',
      visiblePanelIds: ['table'],
      panelConfig: { table: buildPanelConfig().table },
    })

    expect(wrapper.findComponent({ name: 'DataTable' }).props('fillHeight')).toBe(false)
    expect(wrapper.classes()).toContain('workspace-canvas-natural-table')
  })

  it('forwards chart workspace actions and chart builder updates', async () => {
    const wrapper = mountCanvas({
      visiblePanelIds: ['chart'],
      panelConfig: { chart: buildPanelConfig().chart },
    })

    const buttons = wrapper.findAll('button')
    await buttons.find((button) => button.text() === 'Refresh Data').trigger('click')
    await buttons.find((button) => button.text() === 'Export CSV').trigger('click')
    await wrapper.find('select[name="chart_height"]').setValue('520')
    await wrapper.find('.chart-builder-build').trigger('click')
    await wrapper.find('.chart-panel-quick-action').trigger('click')
    await wrapper.find('.chart-panel-build').trigger('click')
    await wrapper.find('.chart-builder-update').trigger('click')
    await wrapper.find('.chart-panel-save').trigger('click')
    await buttons.find((button) => button.text() === 'Reset Colors').trigger('click')

    const colorInput = wrapper.find('input[type="color"]')
    await colorInput.setValue('#654321')

    expect(wrapper.emitted('refresh-data')).toHaveLength(1)
    expect(wrapper.emitted('export-csv')).toHaveLength(1)
    expect(wrapper.emitted('set-chart-height')).toEqual([['520']])
    expect(wrapper.emitted('build-chart')).toEqual([
      [{ source: 'builder' }],
      [{
        chartType: 'bar',
        bindings: {
          x: 3,
          y: { field: 2, aggregation: 'sum' },
          group: null,
          value: { field: null, aggregation: 'none' },
          category: null,
        },
        settings: {},
        filters: [],
        sort: null,
      }],
      [{
        chartType: 'line',
        bindings: {
          x: 1,
          y: { field: 2, aggregation: 'sum' },
          group: null,
          value: { field: null, aggregation: 'none' },
          category: null,
        },
      }],
    ])
    expect(wrapper.emitted('update-chart-definition')).toEqual([
      [{
        chartType: 'bar',
        bindings: {
          x: 3,
          y: { field: 2, aggregation: 'sum' },
          group: null,
          value: { field: null, aggregation: 'none' },
          category: null,
        },
        settings: {},
        filters: [],
        sort: null,
      }],
      [{ chartType: 'bar', bindings: {} }],
    ])
    expect(wrapper.emitted('save-chart')).toHaveLength(1)
    expect(wrapper.emitted('reset-series-colors')).toHaveLength(1)
    expect(wrapper.emitted('set-series-color')).toEqual([
      [{ label: 'Revenue', index: 0, color: '#654321' }],
    ])
  })

  it('forwards statistics workspace events', async () => {
    const wrapper = mountCanvas({
      viewMode: 'statistics',
      visiblePanelIds: ['stats'],
      panelConfig: { stats: buildPanelConfig().stats },
    })

    expect(wrapper.findComponent({ name: 'StatisticsWorkspace' }).props('fullPage')).toBe(true)
    expect(wrapper.classes()).toContain('workspace-canvas-natural-stats')

    await wrapper.find('.stats-load-rows').trigger('click')
    await wrapper.find('.stats-change-semantic').trigger('click')
    await wrapper.find('.stats-change-ordinal').trigger('click')

    expect(wrapper.emitted('load-analysis-rows')).toHaveLength(1)
    expect(wrapper.emitted('change-semantic')).toEqual([
      [{ columnId: 2, semanticType: 'nominal' }],
    ])
    expect(wrapper.emitted('change-ordinal-order')).toEqual([
      [{ columnId: 3, ordinalOrder: ['A', 'B'] }],
    ])
  })

  it('handles saved chart rename, refresh, download, and delete actions', async () => {
    const wrapper = mountCanvas({
      visiblePanelIds: ['library'],
      panelConfig: { library: buildPanelConfig().library },
    })

    const refreshButton = wrapper.findAll('button').find((button) => button.text() === 'Refresh')
    await refreshButton.trigger('click')

    const titleInput = wrapper.find('input[name="saved_chart_title_9"]')
    await titleInput.setValue('Revenue trend v2')
    expect(wrapper.findAll('button').some((button) => button.text() === 'Save')).toBe(true)

    const saveButton = wrapper.findAll('button').find((button) => button.text() === 'Save')
    await saveButton.trigger('click')

    const downloadButton = wrapper.findAll('button').find((button) => button.text() === 'Download PNG')
    const deleteButton = wrapper.findAll('button').find((button) => button.text() === 'Delete')
    await downloadButton.trigger('click')
    await deleteButton.trigger('click')

    expect(wrapper.emitted('refresh-saved-charts')).toHaveLength(1)
    expect(wrapper.emitted('rename-saved-chart')).toEqual([
      [{ chartId: 9, title: 'Revenue trend v2' }],
    ])
    expect(wrapper.emitted('download-saved-chart')).toHaveLength(1)
    expect(wrapper.emitted('download-saved-chart')[0][0]).toMatchObject({ id: 9 })
    expect(wrapper.emitted('delete-saved-chart')).toEqual([[9]])
  })
})
