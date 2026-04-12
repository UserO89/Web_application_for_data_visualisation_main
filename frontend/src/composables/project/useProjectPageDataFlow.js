import { createDefaultChartDefinition, mergeChartDefinition } from '../../charts/chartDefinitions/createUniversalChartDefinition'
import { normalizeChartDefinition } from '../../charts/rules/chartDefinitionValidator'
import { useProjectTableEdits } from './useProjectTableEdits'

export function useProjectPageDataFlow({
  projectId,
  isReadOnly,
  tableRows,
  analysisRows,
  analysisRowsReady,
  analysisRowsError,
  suggestions,
  sortedDatasetColumns,
  schemaStore,
  loadProject,
  loadAnalysisRows,
  ensureAnalysisRowsLoaded,
  loadSuggestions,
  loadStatisticsSummary,
  reloadProjectData,
  refreshProjectData,
  resetProjectDataState,
  setValidationReport,
  applyValidationReportFromProject,
  chartDefinition,
  chartViewportHeight,
  chartViewportCustom,
  chartLabels,
  chartDatasets,
  chartMeta,
  seriesColors,
  loadSeriesColors,
  buildChart,
  clearChart,
  loadSavedCharts,
  resetSavedChartsState,
  ensureWorkspaceInitializedForProject,
  notify,
  t,
}) {
  const areChartDefinitionsEqual = (left, right) =>
    left === right || JSON.stringify(normalizeChartDefinition(left)) === JSON.stringify(normalizeChartDefinition(right))

  const handleChartDefinitionUpdate = (nextDefinition) => {
    const normalized = normalizeChartDefinition(nextDefinition)
    if (areChartDefinitionsEqual(chartDefinition.value, normalized)) return
    chartDefinition.value = normalized
  }

  let chartBuildFrameId = null
  let pendingChartDefinition = null

  const scheduleBuildChart = (definition = chartDefinition.value) => {
    pendingChartDefinition = definition
    if (chartBuildFrameId !== null) return

    chartBuildFrameId = requestAnimationFrame(() => {
      chartBuildFrameId = null
      const nextDefinition = pendingChartDefinition || chartDefinition.value
      pendingChartDefinition = null
      buildChart(nextDefinition)
    })
  }

  const clearScheduledChartBuild = () => {
    if (chartBuildFrameId !== null) {
      cancelAnimationFrame(chartBuildFrameId)
      chartBuildFrameId = null
    }
    pendingChartDefinition = null
  }

  let tableEdits

  const refreshData = async () => {
    const includeAnalysisRows = analysisRowsReady.value
    await refreshProjectData({
      columns: sortedDatasetColumns.value,
      includeAnalysisRows,
    })
    tableEdits.applyPendingTableRows(tableRows)
    if (includeAnalysisRows) {
      tableEdits.applyPendingTableRows(analysisRows)
      scheduleBuildChart(chartDefinition.value)
    }
  }

  tableEdits = useProjectTableEdits({
    projectId,
    isReadOnly,
    tableRows,
    analysisRows,
    analysisRowsReady,
    sortedDatasetColumns,
    scheduleBuildChart,
    chartDefinition,
    refreshData,
    notify,
    t,
  })

  const loadAnalysisRowsForUi = async ({ force = false, notifyOnError = false } = {}) => {
    const loader = force ? loadAnalysisRows : ensureAnalysisRowsLoaded
    const rows = await loader({
      columns: sortedDatasetColumns.value,
      force,
    })

    if (rows) {
      tableEdits.applyPendingTableRows(analysisRows)
    }

    if (!rows && notifyOnError && analysisRowsError.value) {
      notify.error(analysisRowsError.value)
    }

    return rows ? analysisRows.value : rows
  }

  const ensureAnalysisRowsForChart = async (definition = chartDefinition.value) => {
    const rows = await loadAnalysisRowsForUi({ notifyOnError: true })
    if (!rows) return false
    scheduleBuildChart(definition)
    return true
  }

  const reloadAllProjectData = async ({ rebuildSchema = true, includeAnalysisRows = false } = {}) => {
    await reloadProjectData({
      rebuildSchema,
      columns: sortedDatasetColumns.value,
      includeAnalysisRows,
    })
  }

  const resetDatasetState = ({ clearValidationReport = false } = {}) => {
    if (clearValidationReport) {
      setValidationReport(null)
    }

    tableEdits.clearPendingTableChanges()
    seriesColors.value = {}
    resetProjectDataState()
    chartLabels.value = []
    chartDatasets.value = []
    chartMeta.value = {}
    chartDefinition.value = createDefaultChartDefinition('line')
    chartViewportHeight.value = 320
    chartViewportCustom.value = false
    resetSavedChartsState()
    schemaStore.applySchema(null)
  }

  const applySuggestedChartDefinition = () => {
    const suggested = suggestions.value[0]?.definition
    if (!suggested) {
      clearChart()
      return
    }

    chartDefinition.value = normalizeChartDefinition(
      mergeChartDefinition(createDefaultChartDefinition(suggested.chartType || 'line'), suggested)
    )

    if (analysisRowsReady.value) {
      scheduleBuildChart(chartDefinition.value)
    } else {
      clearChart()
    }
  }

  const handleProjectWithDataset = async (loadedProject) => {
    seriesColors.value = loadSeriesColors()
    await reloadAllProjectData({ rebuildSchema: false })
    if (!isReadOnly.value) {
      await loadSavedCharts()
    }
    applySuggestedChartDefinition()
    applyValidationReportFromProject(loadedProject?.dataset?.validation_report_json)
    await ensureWorkspaceInitializedForProject()
  }

  const loadProjectPage = async () => {
    await loadProject({
      onDatasetMissing: async () => {
        resetDatasetState({ clearValidationReport: true })
      },
      onDatasetLoaded: handleProjectWithDataset,
    })
  }

  const handleLoadAnalysisRows = async () => {
    const rows = await loadAnalysisRowsForUi({
      force: analysisRowsReady.value,
      notifyOnError: true,
    })
    if (!rows) return
    scheduleBuildChart(chartDefinition.value)
  }

  const handleBuildChart = async (definition = chartDefinition.value) => {
    await ensureAnalysisRowsForChart(definition)
  }

  const refreshDerivedData = async () => {
    await Promise.all([loadSuggestions(), loadStatisticsSummary()])
    if (analysisRowsReady.value) {
      scheduleBuildChart(chartDefinition.value)
    }
  }

  return {
    tableSaving: tableEdits.tableSaving,
    tableEditing: tableEdits.tableEditing,
    tableHasUnsavedChanges: tableEdits.tableHasUnsavedChanges,
    handleCellEdit: tableEdits.handleCellEdit,
    handleSaveTable: tableEdits.handleSaveTable,
    loadAnalysisRowsForUi,
    handleChartDefinitionUpdate,
    scheduleBuildChart,
    clearScheduledChartBuild,
    loadProjectPage,
    refreshData,
    handleLoadAnalysisRows,
    handleBuildChart,
    refreshDerivedData,
    resetDatasetState,
  }
}
