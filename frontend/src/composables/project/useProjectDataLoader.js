import { ref } from 'vue'
import { projectsApi } from '../../api/projects'
import { mapApiRows, resolveProjectId, unpackRowsPayload } from '../../utils/project'
import { extractApiErrorMessage } from '../../utils/api/errors'

export const useProjectDataLoader = ({
  projectId,
  schemaStore,
} = {}) => {
  const project = ref(null)
  const loading = ref(true)
  const projectError = ref('')

  const tableRows = ref([])
  const tableRowsError = ref('')
  const analysisRows = ref([])
  const analysisRowsError = ref('')
  const suggestions = ref([])
  const suggestionsError = ref('')
  const schemaError = ref('')
  const statisticsSummary = ref([])
  const statisticsLoading = ref(false)
  const statisticsError = ref('')

  const resolvedProjectId = () => resolveProjectId(projectId)
  const yieldToMainThread = () =>
    new Promise((resolve) => {
      if (typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(() => resolve())
        return
      }
      setTimeout(resolve, 0)
    })

  const mapRowsInBatches = async (rows, columns, batchSize = 400) => {
    if (!Array.isArray(rows) || rows.length <= batchSize) {
      return mapApiRows(Array.isArray(rows) ? rows : [], columns)
    }

    const mappedRows = []
    for (let index = 0; index < rows.length; index += batchSize) {
      const chunk = rows.slice(index, index + batchSize)
      mappedRows.push(...mapApiRows(chunk, columns))
      await yieldToMainThread()
    }
    return mappedRows
  }

  const fetchProjectRows = async ({ allPages = false, perPage = 500 } = {}) => {
    const id = resolvedProjectId()
    if (!id) return []

    if (!allPages) {
      const response = await projectsApi.getRows(id)
      const payload = response.data ?? response
      return unpackRowsPayload(payload).rows
    }

    const collected = []
    let page = 1
    while (true) {
      const response = await projectsApi.getRows(id, page, perPage)
      const payload = response.data ?? response
      const { rows, lastPage, isPaginated } = unpackRowsPayload(payload)
      collected.push(...rows)
      if (!isPaginated || !lastPage || page >= lastPage) break
      page += 1
    }
    return collected
  }

  const loadRows = async ({ columns = [], onRowsLoaded } = {}) => {
    tableRowsError.value = ''
    try {
      const rows = await fetchProjectRows()
      tableRows.value = mapApiRows(rows, columns)
      if (typeof onRowsLoaded === 'function') {
        onRowsLoaded()
      }
    } catch (e) {
      tableRows.value = []
      tableRowsError.value = extractApiErrorMessage(e, 'Failed to load table rows.')
    }
  }

  const loadAnalysisRows = async ({ columns = [], perPage = 500 } = {}) => {
    analysisRowsError.value = ''
    try {
      const rows = await fetchProjectRows({ allPages: true, perPage })
      analysisRows.value = await mapRowsInBatches(rows, columns)
    } catch (e) {
      analysisRows.value = []
      analysisRowsError.value = extractApiErrorMessage(e, 'Failed to load analysis rows.')
    }
  }

  const loadSemanticSchema = async (rebuild = false) => {
    const id = resolvedProjectId()
    if (!id) return

    schemaError.value = ''
    try {
      await schemaStore.fetchSchema(id, { rebuild })
    } catch (e) {
      schemaError.value = extractApiErrorMessage(e, 'Failed to load semantic schema.')
    }
  }

  const loadStatisticsSummary = async () => {
    const id = resolvedProjectId()
    if (!id) {
      statisticsSummary.value = []
      statisticsError.value = ''
      return
    }

    statisticsLoading.value = true
    statisticsError.value = ''
    try {
      const response = await projectsApi.getStatistics(id)
      statisticsSummary.value = response.statistics || []
    } catch (e) {
      statisticsError.value = extractApiErrorMessage(e, 'Failed to load statistics summary.')
    } finally {
      statisticsLoading.value = false
    }
  }

  const loadSuggestions = async () => {
    const id = resolvedProjectId()
    if (!id) {
      suggestions.value = []
      return
    }

    suggestionsError.value = ''
    try {
      const response = await projectsApi.getChartSuggestions(id)
      suggestions.value = response.suggestions || []
    } catch (e) {
      suggestions.value = []
      suggestionsError.value = extractApiErrorMessage(e, 'Failed to load chart suggestions.')
    }
  }

  const reloadProjectData = async ({ rebuildSchema = true, columns = [], onRowsLoaded } = {}) => {
    await Promise.all([
      loadRows({ columns, onRowsLoaded }),
      loadAnalysisRows({ columns }),
      loadSemanticSchema(rebuildSchema),
      loadSuggestions(),
      loadStatisticsSummary(),
    ])
  }

  const refreshData = async ({ columns = [], onRowsLoaded, onAfterRefresh } = {}) => {
    await reloadProjectData({ rebuildSchema: true, columns, onRowsLoaded })
    if (typeof onAfterRefresh === 'function') {
      onAfterRefresh()
    }
  }

  const loadProject = async ({ onDatasetMissing, onDatasetLoaded } = {}) => {
    const id = resolvedProjectId()
    loading.value = true
    if (!id) {
      project.value = null
      loading.value = false
      return
    }

    projectError.value = ''
    try {
      const response = await projectsApi.get(id)
      project.value = response.project

      if (!project.value?.dataset) {
        if (typeof onDatasetMissing === 'function') {
          await onDatasetMissing()
        }
        return
      }

      if (typeof onDatasetLoaded === 'function') {
        await onDatasetLoaded(project.value)
      }
    } catch (e) {
      project.value = null
      projectError.value = extractApiErrorMessage(e, 'Failed to load project.')
    } finally {
      loading.value = false
    }
  }

  const resetProjectDataState = ({ clearProject = false } = {}) => {
    if (clearProject) {
      project.value = null
    }
    tableRows.value = []
    analysisRows.value = []
    suggestions.value = []
    statisticsSummary.value = []
    projectError.value = ''
    tableRowsError.value = ''
    analysisRowsError.value = ''
    suggestionsError.value = ''
    schemaError.value = ''
    statisticsError.value = ''
  }

  return {
    project,
    loading,
    projectError,
    tableRows,
    tableRowsError,
    analysisRows,
    analysisRowsError,
    suggestions,
    suggestionsError,
    schemaError,
    statisticsSummary,
    statisticsLoading,
    statisticsError,
    loadProject,
    loadRows,
    loadAnalysisRows,
    loadSemanticSchema,
    loadStatisticsSummary,
    loadSuggestions,
    reloadProjectData,
    refreshData,
    resetProjectDataState,
  }
}
