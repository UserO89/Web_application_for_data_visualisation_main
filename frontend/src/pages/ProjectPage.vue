<template>
  <div class="project-page app-content">
    <div v-if="loading" class="loading panel">Loading...</div>
    <div v-else-if="!project" class="error panel">Project not found</div>

    <ProjectDatasetImportSection
      v-else-if="!project.dataset"
      :import-mode="importMode"
      :import-options="importOptions"
      :selected-file="selectedFile"
      :importing="importing"
      :manual-headers="manualHeaders"
      :manual-rows-input="manualRowsInput"
      :manual-error="manualError"
      @back="$router.push({ name: 'projects' })"
      @change-import-mode="importMode = $event"
      @change-import-options="importOptions = $event"
      @file-select="handleFileSelect"
      @import="handleImport"
      @add-manual-column="addManualColumn"
      @remove-manual-column="removeManualColumn"
      @add-manual-row="addManualRow"
      @remove-manual-row="removeManualRow"
      @manual-import="handleManualImport"
      @change-manual-headers="manualHeaders = $event"
      @change-manual-rows="manualRowsInput = $event"
    />

    <div v-else>
      <div class="top-row top-row-actions">
        <div class="top-row-left">
          <button class="btn" @click="$router.push({ name: 'projects' })"><- Back to Projects</button>
          <div class="view-mode-switch">
            <button type="button" :class="['btn', { primary: viewMode === 'table' }]" @click="setViewMode('table')">Table</button>
            <button type="button" :class="['btn', { primary: viewMode === 'visualization' }]" @click="setViewMode('visualization')">Visualization</button>
            <button type="button" :class="['btn', { primary: viewMode === 'statistics' }]" @click="setViewMode('statistics')">Statistics</button>
            <button type="button" :class="['btn', { primary: viewMode === 'workspace' }]" @click="setViewMode('workspace')">Workspace</button>
          </div>
        </div>
        <div class="top-row-right">
          <button
            v-if="importValidation"
            type="button"
            class="btn"
            @click="openValidationModal"
          >
            Validation Report
            <span class="validation-pill">{{ validationIssueCount }}</span>
          </button>
        </div>
      </div>

      <div ref="workspaceRef" class="workspace-canvas" :style="{ height: `${workspaceHeight}px` }">
        <section
          v-for="panelId in visiblePanelIds"
          :key="panelId"
          class="workspace-panel panel"
          :style="panelStyle(panelId)"
          @mousedown="viewMode === 'workspace' && bringToFront(panelId)"
        >
          <header class="drag-handle" @mousedown.left.prevent="viewMode === 'workspace' && startDrag(panelId, $event)">
            <div class="title">{{ panelConfig[panelId].title }}</div>
            <div class="sub">{{ panelConfig[panelId].subtitle }}</div>
          </header>

          <div :class="['panel-content', `${panelId}-content`]">
            <template v-if="panelId === 'table'">
              <div class="table-wrap table-fill">
                <DataTable :columns="tableColumns" :rows="tableRows" @cell-edited="handleCellEdit" />
              </div>
              <div class="table-bottom-actions">
                <button class="btn" type="button" @click="exportTableCsv">Export Table CSV</button>
              </div>
            </template>

            <template v-else-if="panelId === 'chart'">
              <div class="chart-shell">
                <div
                  ref="chartViewportRef"
                  class="chart-main chart-main-resizable"
                  :style="chartViewportStyle"
                >
                  <ChartPanel
                    embedded
                    :labels="chartLabels"
                    :datasets="chartDatasets"
                    :meta="chartMeta"
                    :type="chartType"
                    @clear="clearChart"
                  />
                </div>
                <div class="chart-tools">
                  <div class="controls">
                    <button class="btn" type="button" @click="refreshData">Refresh Data</button>
                    <button class="btn" type="button" @click="exportTableCsv">Export CSV</button>
                    <label class="chart-size-control" for="chart-height-select">Chart height</label>
                    <select
                      id="chart-height-select"
                      class="chart-size-select"
                      :value="chartViewportPresetValue"
                      @change="setChartViewportHeight($event.target.value)"
                    >
                      <option value="320">Compact</option>
                      <option value="420">Medium</option>
                      <option value="520">Tall</option>
                      <option value="620">XL</option>
                      <option v-if="chartViewportPresetValue === 'custom'" value="custom">Custom (drag)</option>
                    </select>
                  </div>
                  <ChartBuilder
                    :schema-columns="schemaColumns"
                    v-model="chartDefinition"
                    :suggestions="suggestions"
                    @build="buildChart"
                  />
                  <div v-if="chartDatasets.length" class="series-colors">
                    <div class="series-colors-head">
                      <div class="analysis-title">Series Colors</div>
                      <button type="button" class="btn" @click="resetSeriesColors">Reset Colors</button>
                    </div>
                    <div class="series-colors-grid">
                      <div v-for="(ds, i) in chartDatasets" :key="`series-color-${ds.label}-${i}`" class="series-color-item">
                        <span class="series-color-name">{{ ds.label || `Series ${i + 1}` }}</span>
                        <input
                          type="color"
                          class="series-color-input"
                          :value="getSeriesColor(ds.label, i)"
                          @input="setSeriesColor(ds.label, i, $event.target.value)"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </template>

            <template v-else-if="panelId === 'stats'">
              <div class="stats-shell">
                <StatisticsWorkspace
                  :schema-columns="schemaColumns"
                  :statistics="statisticsSummary"
                  :rows="analysisRows"
                  :loading="statisticsLoading"
                  :error="statisticsError"
                  :updating-column-id="schemaUpdatingColumnId"
                  @change-semantic="handleSemanticTypeChange"
                  @change-ordinal-order="handleOrdinalOrderChange"
                />
              </div>
            </template>

          </div>

          <div
            v-if="viewMode === 'workspace'"
            v-for="d in resizeDirs"
            :key="`${panelId}-${d}`"
            :class="['resize-handle', `h-${d}`]"
            @mousedown.left.stop.prevent="startResize(panelId, d, $event)"
          ></div>
        </section>
      </div>

    </div>

    <ProjectValidationModal
      :is-open="validationModalOpen"
      :import-validation="importValidation"
      :validation-summary-line="validationSummaryLine"
      :validation-summary="validationSummary"
      :severity-order="severityOrder"
      :validation-issues-by-severity="validationIssuesBySeverity"
      :validation-column-rows="validationColumnRows"
      :editable-validation-issue-count="editableValidationIssueCount"
      :validation-save-state="validationSaveState"
      :saving-validation="savingValidation"
      :format-issue-target-label="formatIssueTargetLabel"
      :format-issue-value="formatIssueValue"
      @close="closeValidationModal"
      @clear="clearValidationReport"
      @save="applyValidationEdits"
    />
  </div>
</template>

<script>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import ChartPanel from '../components/project/ChartPanel.vue'
import ChartBuilder from '../components/project/ChartBuilder.vue'
import DataTable from '../components/project/DataTable.vue'
import StatisticsWorkspace from '../components/project/StatisticsWorkspace.vue'
import ProjectDatasetImportSection from '../components/project/ProjectDatasetImportSection.vue'
import ProjectValidationModal from '../components/project/ProjectValidationModal.vue'
import { projectsApi } from '../api/projects'
import { useDatasetSchemaStore } from '../stores/datasetSchema'
import { buildSemanticChartData } from '../charts/chartDataTransformers/buildSemanticChartData'
import { normalizeChartDefinition, validateChartDefinition } from '../charts/rules/chartDefinitionValidator'
import { createDefaultChartDefinition, mergeChartDefinition } from '../charts/chartDefinitions/createUniversalChartDefinition'
import { cellField, buildCsvLines, buildRowUpdateValues, defaultSeriesColor, clampChartViewportHeight } from '../utils/project'
import { useManualDatasetBuilder } from '../composables/project/useManualDatasetBuilder'
import { useValidationReport } from '../composables/project/useValidationReport'
import { useProjectDataLoader } from '../composables/project/useProjectDataLoader'
import { useProjectWorkspace } from '../composables/project/useProjectWorkspace'

const CHART_COLORS_STORAGE_PREFIX = 'dataviz.chart.colors.v1.'
const DEFAULT_CHART_PALETTE = [
  '#1db954', '#35c9a3', '#4cc9f0', '#4895ef', '#4361ee',
  '#3a0ca3', '#b5179e', '#f72585', '#f15bb5', '#ff8fab',
  '#f8961e', '#f9c74f', '#90be6d', '#43aa8b', '#577590',
]
const MIN_CHART_VIEWPORT_HEIGHT = 280
const MAX_CHART_VIEWPORT_HEIGHT = 920

export default {
  name: 'ProjectPage',
  components: {
    DataTable,
    ChartPanel,
    ChartBuilder,
    StatisticsWorkspace,
    ProjectDatasetImportSection,
    ProjectValidationModal,
  },
  setup() {
    const route = useRoute()
    const projectId = computed(() => String(route.params.id))
    const workspaceRef = ref(null)
    const chartViewportRef = ref(null)
    const schemaStore = useDatasetSchemaStore()

    const selectedFile = ref(null)
    const importing = ref(false)
    const importOptions = ref({ has_header: true, delimiter: ',' })
    const importMode = ref('file')

    const {
      manualHeaders,
      manualRowsInput,
      manualError,
      addManualColumn,
      removeManualColumn,
      addManualRow,
      removeManualRow,
      prepareManualImportFile,
    } = useManualDatasetBuilder()

    const {
      project,
      loading,
      tableRows,
      analysisRows,
      suggestions,
      statisticsSummary,
      statisticsLoading,
      statisticsError,
      loadProject,
      loadSuggestions,
      loadStatisticsSummary,
      reloadProjectData,
      refreshData: refreshProjectData,
      resetProjectDataState,
    } = useProjectDataLoader({
      projectId,
      schemaStore,
    })

    const sortedDatasetColumns = computed(() =>
      [...(project.value?.dataset?.columns || [])].sort((a, b) => Number(a.position) - Number(b.position))
    )

    const {
      importValidation,
      validationModalOpen,
      validationDrafts,
      savingValidation,
      validationSaveState,
      severityOrder,
      validationSummary,
      validationIssueCount,
      editableValidationIssueCount,
      validationIssuesBySeverity,
      validationColumnRows,
      validationSummaryLine,
      setValidationReport,
      clearValidationReport,
      openValidationModal,
      closeValidationModal,
      initValidationDrafts,
      resolveIssueTarget,
      applyValidationEdits: applyValidationEditsCore,
      applyValidationReportFromProject,
      formatIssueValue,
      formatIssueTargetLabel,
      resetValidationRouteState,
    } = useValidationReport({
      projectId,
      sortedDatasetColumns,
      tableRows,
    })

    const {
      panelConfig,
      resizeDirs,
      viewMode,
      visiblePanelIds,
      workspaceHeight,
      panelStyle,
      setViewMode,
      bringToFront,
      startDrag,
      startResize,
      saveLayouts,
      ensureWorkspaceInitializedForProject,
      resetWorkspaceRouteState,
      attachWorkspaceListeners,
      detachWorkspaceListeners,
    } = useProjectWorkspace({
      project,
      projectId,
      workspaceRef,
    })

    const chartType = ref('line')
    const chartDefinition = ref(createDefaultChartDefinition('line'))
    const chartViewportHeight = ref(320)
    const chartViewportCustom = ref(false)
    const chartLabels = ref([])
    const chartDatasets = ref([])
    const chartMeta = ref({})
    const seriesColors = ref({})

    const nullAwareFormatter = (cell) => {
      const value = cell.getValue()
      const el = cell.getElement()
      if (value === null || value === undefined) {
        el?.classList.add('cell-null')
        return 'null'
      }
      el?.classList.remove('cell-null')
      return value
    }

    const tableColumns = computed(() =>
      sortedDatasetColumns.value.map((c) => ({
        title: c.name,
        field: cellField(c.position),
        metaType: c.type,
        editor: 'input',
        formatter: nullAwareFormatter,
      }))
    )
    const schemaColumns = computed(() =>
      (schemaStore.columns || [])
        .map((column) => ({
          ...column,
          fieldKey: cellField(column.position),
        }))
        .sort((a, b) => Number(a.position) - Number(b.position))
    )
    const schemaUpdatingColumnId = computed(() => schemaStore.updatingColumnId)

    const chartColorsKey = () => `${CHART_COLORS_STORAGE_PREFIX}${projectId.value}`

    const loadSeriesColors = () => {
      try {
        const raw = localStorage.getItem(chartColorsKey())
        if (!raw) return {}
        const parsed = JSON.parse(raw)
        return parsed && typeof parsed === 'object' ? parsed : {}
      } catch (_) {
        return {}
      }
    }

    const persistSeriesColors = () => {
      try {
        localStorage.setItem(chartColorsKey(), JSON.stringify(seriesColors.value || {}))
      } catch (_) {}
    }

    const getSeriesColor = (label, index = 0) => {
      if (label && seriesColors.value[label]) return seriesColors.value[label]
      const indexedKey = `series_${index}`
      if (seriesColors.value[indexedKey]) return seriesColors.value[indexedKey]
      return defaultSeriesColor(index, DEFAULT_CHART_PALETTE)
    }

    const applyColorsToCurrentChart = () => {
      if (!chartDatasets.value.length) return
      chartDatasets.value = chartDatasets.value.map((ds, i) => ({
        ...ds,
        color: getSeriesColor(ds.label, i),
      }))
    }

    const setSeriesColor = (label, index, color) => {
      if (!color) return
      const keyLabel = label || `series_${index}`
      seriesColors.value = { ...seriesColors.value, [keyLabel]: color }
      applyColorsToCurrentChart()
      persistSeriesColors()
    }

    const resetSeriesColors = () => {
      seriesColors.value = {}
      applyColorsToCurrentChart()
      persistSeriesColors()
    }

    const CHART_HEIGHT_PRESETS = [320, 420, 520, 620]
    const chartViewportPresetValue = computed(() =>
      !chartViewportCustom.value && CHART_HEIGHT_PRESETS.includes(chartViewportHeight.value)
        ? String(chartViewportHeight.value)
        : 'custom'
    )

    const chartViewportStyle = computed(() => {
      if (chartViewportCustom.value) {
        return { minHeight: `${MIN_CHART_VIEWPORT_HEIGHT}px` }
      }
      return {
        height: `${chartViewportHeight.value}px`,
        minHeight: `${MIN_CHART_VIEWPORT_HEIGHT}px`,
      }
    })

    const setChartViewportHeight = (value) => {
      if (value === 'custom') return
      const parsed = Number(value)
      if (!Number.isFinite(parsed)) return
      chartViewportHeight.value = clampChartViewportHeight(
        parsed,
        MIN_CHART_VIEWPORT_HEIGHT,
        MAX_CHART_VIEWPORT_HEIGHT
      )
      chartViewportCustom.value = false
      applyingChartHeightPreset = true
      requestAnimationFrame(() => {
        applyingChartHeightPreset = false
      })
    }

    const syncValidationDraftsIfModalOpen = () => {
      if (validationModalOpen.value && importValidation.value) {
        initValidationDrafts()
      }
    }

    const reloadAllProjectData = async ({ rebuildSchema = true } = {}) => {
      await reloadProjectData({
        rebuildSchema,
        columns: sortedDatasetColumns.value,
        onRowsLoaded: syncValidationDraftsIfModalOpen,
      })
    }

    const resetDatasetState = ({ clearValidationReport = false } = {}) => {
      if (clearValidationReport) {
        setValidationReport(null, false)
      }
      seriesColors.value = {}
      resetProjectDataState()
      chartLabels.value = []
      chartDatasets.value = []
      chartMeta.value = {}
      chartDefinition.value = createDefaultChartDefinition('line')
      chartViewportHeight.value = 320
      chartViewportCustom.value = false
      schemaStore.applySchema(null)
    }

    const applySuggestedChartDefinition = () => {
      if (chartDatasets.value.length) return
      const suggested = suggestions.value[0]?.definition
      if (!suggested) {
        clearChart()
        return
      }
      chartDefinition.value = normalizeChartDefinition(
        mergeChartDefinition(createDefaultChartDefinition(suggested.chartType || 'line'), suggested)
      )
      buildChart(chartDefinition.value)
    }

    const handleProjectWithDataset = async (loadedProject) => {
      seriesColors.value = loadSeriesColors()
      await reloadAllProjectData({ rebuildSchema: false })
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

    const refreshData = async () => {
      await refreshProjectData({
        columns: sortedDatasetColumns.value,
        onRowsLoaded: syncValidationDraftsIfModalOpen,
        onAfterRefresh: () => buildChart(chartDefinition.value),
      })
    }

    const handleFileSelect = (e) => {
      selectedFile.value = e.target.files?.[0] || null
    }

    const handleImport = async () => {
      if (!selectedFile.value) return
      importing.value = true
      manualError.value = ''
      try {
        const response = await projectsApi.importDataset(projectId.value, selectedFile.value, importOptions.value)
        setValidationReport(response.validation || null, false)
        await loadProjectPage()
        openValidationModal()
      } catch (e) {
        window.alert('Import error: ' + (e.response?.data?.message || e.message))
      } finally {
        importing.value = false
      }
    }

    const handleManualImport = async () => {
      const file = prepareManualImportFile()
      if (!file) return

      importing.value = true
      try {
        const response = await projectsApi.importDataset(projectId.value, file, { has_header: true, delimiter: ',' })
        setValidationReport(response.validation || null, false)
        await loadProjectPage()
        openValidationModal()
      } catch (e) {
        manualError.value = e?.response?.data?.message || 'Failed to create table from manual data.'
      } finally {
        importing.value = false
      }
    }

    const handleCellEdit = async (data) => {
      try {
        const values = buildRowUpdateValues(data.row, sortedDatasetColumns.value)
        await projectsApi.updateRow(projectId.value, data.row.id, values)
      } catch (e) {
        console.error(e)
      }
    }

    const handleSemanticTypeChange = async ({ columnId, semanticType, analyticalRole, isExcludedFromAnalysis }) => {
      try {
        await schemaStore.setSemanticType(projectId.value, columnId, {
          semantic_type: semanticType,
          analytical_role: analyticalRole,
          is_excluded_from_analysis: isExcludedFromAnalysis,
        })
        await Promise.all([loadSuggestions(), loadStatisticsSummary()])
        buildChart(chartDefinition.value)
      } catch (e) {
        console.error(e)
      }
    }

    const handleOrdinalOrderChange = async ({ columnId, ordinalOrder }) => {
      if (!Array.isArray(ordinalOrder) || ordinalOrder.length < 2) return
      try {
        await schemaStore.setOrdinalOrder(projectId.value, columnId, ordinalOrder)
        await Promise.all([loadSuggestions(), loadStatisticsSummary()])
        buildChart(chartDefinition.value)
      } catch (e) {
        console.error(e)
      }
    }

    const buildChart = (nextDefinition = chartDefinition.value) => {
      const normalized = normalizeChartDefinition(nextDefinition)
      const validation = validateChartDefinition(normalized, schemaColumns.value)
      chartDefinition.value = validation.normalizedDefinition

      if (!validation.valid) {
        chartLabels.value = []
        chartDatasets.value = []
        chartMeta.value = {}
        chartType.value = normalized.chartType
        return
      }

      const definition = buildSemanticChartData({
        definition: validation.normalizedDefinition,
        schemaColumns: schemaColumns.value,
        rows: analysisRows.value.length ? analysisRows.value : tableRows.value,
        getSeriesColor,
      })

      chartType.value = definition.type || validation.normalizedDefinition.chartType
      chartLabels.value = definition.labels || []
      chartDatasets.value = definition.datasets || []
      chartMeta.value = definition.meta || {}
    }

    const clearChart = () => {
      chartLabels.value = []
      chartDatasets.value = []
      chartMeta.value = {}
    }

    const exportTableCsv = () => {
      if (!tableColumns.value.length || !tableRows.value.length) {
        window.alert('No table data to export.')
        return
      }

      const headers = tableColumns.value.map((c) => c.title)
      const lines = buildCsvLines({
        headers,
        rows: tableRows.value,
        mapRowToValues: (row) => tableColumns.value.map((column) => row[column.field] ?? ''),
      })
      const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${project.value?.title || 'project'}-table.csv`
      a.click()
      URL.revokeObjectURL(url)
    }

    const applyValidationEdits = async () => {
      await applyValidationEditsCore({
        reloadProjectData: reloadAllProjectData,
        rebuildChart: () => buildChart(chartDefinition.value),
      })
    }

    const resetRouteState = () => {
      resetWorkspaceRouteState()
      resetValidationRouteState()
      resetDatasetState()
    }

    const onEsc = (e) => {
      if (e.key === 'Escape' && validationModalOpen.value) {
        closeValidationModal()
      }
    }

    let chartViewportResizeObserver = null
    let applyingChartHeightPreset = false

    onMounted(() => {
      loadProjectPage()
      attachWorkspaceListeners()
      window.addEventListener('keydown', onEsc)

      if (typeof ResizeObserver !== 'undefined' && chartViewportRef.value) {
        chartViewportResizeObserver = new ResizeObserver((entries) => {
          const height = entries?.[0]?.contentRect?.height
          if (!Number.isFinite(height)) return
          const next = clampChartViewportHeight(
            height,
            MIN_CHART_VIEWPORT_HEIGHT,
            MAX_CHART_VIEWPORT_HEIGHT
          )
          if (applyingChartHeightPreset) {
            chartViewportHeight.value = next
            return
          }
          if (!chartViewportCustom.value && Math.abs(next - chartViewportHeight.value) < 2) return
          if (!chartViewportCustom.value && Math.abs(next - chartViewportHeight.value) >= 2) {
            chartViewportCustom.value = true
          }
          chartViewportHeight.value = next
        })
        chartViewportResizeObserver.observe(chartViewportRef.value)
      }
    })

    onBeforeUnmount(() => {
      detachWorkspaceListeners()
      window.removeEventListener('keydown', onEsc)
      if (chartViewportResizeObserver) {
        chartViewportResizeObserver.disconnect()
        chartViewportResizeObserver = null
      }
      saveLayouts()
    })

    watch(() => route.params.id, () => {
      resetRouteState()
      loadProjectPage()
    })

    return {
      project, loading, selectedFile, importing, importOptions, importMode, manualHeaders, manualRowsInput, manualError,
      importValidation, validationModalOpen, validationDrafts, savingValidation, validationSaveState,
      openValidationModal, closeValidationModal, clearValidationReport, applyValidationEdits,
      resolveIssueTarget, formatIssueValue, formatIssueTargetLabel,
      severityOrder, validationSummary, validationSummaryLine, validationIssuesBySeverity,
      validationIssueCount, validationColumnRows, editableValidationIssueCount,
      getSeriesColor, setSeriesColor, resetSeriesColors,
      viewMode, setViewMode, visiblePanelIds,
      tableRows, tableColumns, analysisRows, schemaColumns, schemaUpdatingColumnId,
      suggestions, statisticsSummary, statisticsLoading, statisticsError,
      chartType, chartDefinition,
      chartViewportPresetValue, chartViewportStyle, setChartViewportHeight,
      chartLabels, chartDatasets, chartMeta, workspaceRef, chartViewportRef, workspaceHeight, panelConfig, resizeDirs, panelStyle,
      bringToFront, startDrag, startResize, handleFileSelect, handleImport,
      addManualColumn, removeManualColumn, addManualRow, removeManualRow, handleManualImport, handleCellEdit,
      handleSemanticTypeChange, handleOrdinalOrderChange,
      buildChart, clearChart, refreshData, exportTableCsv,
    }
  },
}
</script>

<style scoped>
.project-page { display: flex; flex-direction: column; gap: 18px; }
.app-content { flex: 1; }
.top-row { margin-bottom: 12px; }
.top-row-actions {
  width: min(1200px, 100%);
  margin-left: auto;
  margin-right: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}
.top-row-left { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.top-row-right { display: flex; align-items: center; gap: 8px; }
.view-mode-switch { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.loading { text-align: center; padding: 3rem; color: var(--muted); }
.error { text-align: center; padding: 2rem; color: #fca5a5; }
.validation-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  margin-left: 8px;
  padding: 2px 6px;
  border-radius: 999px;
  background: rgba(29, 185, 84, 0.2);
  color: #93f6b3;
  font-size: 11px;
  font-weight: 700;
}

.workspace-canvas { position: relative; width: 100%; min-height: 760px; }
.workspace-panel { position: absolute; overflow: hidden; box-sizing: border-box; padding: 12px; }
.drag-handle { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid var(--border); cursor: move; user-select: none; }
.drag-handle .title { font-weight: 700; }
.drag-handle .sub { font-size: 12px; color: var(--muted); }

.panel-content { height: calc(100% - 44px); overflow: hidden; }
.table-content, .stats-content { overflow: auto; }
.chart-content { overflow: auto; }
.table-fill { min-height: 240px; max-height: calc(100% - 42px); }

.chart-shell { display: flex; flex-direction: column; gap: 10px; min-height: 100%; }
.chart-main { flex: 0 0 auto; min-height: 320px; }
.chart-main-resizable {
  width: 100%;
  min-width: 320px;
  max-width: 100%;
  align-self: flex-start;
  resize: both;
  overflow: auto;
  max-height: 920px;
  border: 1px dashed var(--border);
  border-radius: 10px;
  padding: 6px;
}
.chart-tools { display: flex; flex-direction: column; gap: 10px; }
.chart-size-control { color: var(--muted); font-size: 12px; align-self: center; }
.chart-size-select {
  min-width: 120px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  color: var(--text);
  padding: 7px 9px;
  font-size: 13px;
}

.stats-shell { display: flex; flex-direction: column; gap: 10px; height: 100%; overflow: auto; padding-right: 2px; }
.controls { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }
.series-colors { border: 1px solid var(--border); border-radius: 10px; background: #171717; padding: 10px; margin-bottom: 10px; }
.series-colors-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 8px; }
.series-colors-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px; }
.series-color-item { display: flex; align-items: center; justify-content: space-between; gap: 10px; border: 1px solid var(--border); border-radius: 8px; background: #1c1c1c; padding: 7px 10px; }
.series-color-name { font-size: 12px; color: var(--muted); max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.series-color-input { width: 32px; height: 22px; border: none; border-radius: 6px; background: transparent; padding: 0; cursor: pointer; }
.series-color-input::-webkit-color-swatch-wrapper { padding: 0; }
.series-color-input::-webkit-color-swatch { border: 1px solid var(--border); border-radius: 6px; }
.table-bottom-actions { margin-top: 8px; display: flex; justify-content: flex-end; }
.analysis-title { font-size: 13px; font-weight: 700; margin-bottom: 8px; }

.resize-handle { position: absolute; z-index: 5; }
.h-n { top: -4px; left: 12px; right: 12px; height: 8px; cursor: n-resize; }
.h-s { bottom: -4px; left: 12px; right: 12px; height: 8px; cursor: s-resize; }
.h-e { top: 12px; bottom: 12px; right: -4px; width: 8px; cursor: e-resize; }
.h-w { top: 12px; bottom: 12px; left: -4px; width: 8px; cursor: w-resize; }

@media (max-width: 980px) {
  .workspace-canvas { min-height: 980px; }
}
</style>
