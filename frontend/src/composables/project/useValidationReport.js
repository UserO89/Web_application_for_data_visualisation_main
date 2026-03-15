import { computed, ref } from 'vue'
import {
  normalizeValidationReport,
} from '../../utils/validationReport'
import {
  formatIssueValue,
  readJsonStorage,
  removeStorageItem,
  resolveProjectId,
  writeJsonStorage,
} from '../../utils/project'

const VALIDATION_STORAGE_PREFIX = 'dataviz.validation.report.v1.'

export const useValidationReport = ({
  projectId,
} = {}) => {
  const importValidation = ref(null)
  const validationModalOpen = ref(false)

  const validationSummary = computed(() => importValidation.value?.summary || {
    rows_imported: 0,
    rows_skipped: 0,
    problematic_columns: 0,
    normalized_cells: 0,
    nullified_cells: 0,
  })
  const validationProblemColumns = computed(() =>
    Array.isArray(importValidation.value?.problem_columns)
      ? importValidation.value.problem_columns
      : []
  )
  const validationProblemColumnCount = computed(() => {
    const reviewCount = Number(validationSummary.value?.problematic_columns || 0)
    if (reviewCount > 0) return reviewCount
    return validationProblemColumns.value.length
  })
  const validationSummaryLine = computed(() => {
    const summary = validationSummary.value || {}
    return `${summary.rows_imported || 0} imported, ${summary.rows_skipped || 0} skipped, ${summary.problematic_columns || 0} problematic columns, ${summary.normalized_cells || 0} normalized, ${summary.nullified_cells || 0} nullified.`
  })

  const validationKey = () => `${VALIDATION_STORAGE_PREFIX}${resolveProjectId(projectId)}`

  const persistValidationReport = () => {
    if (!importValidation.value) {
      removeStorageItem(validationKey())
      return
    }
    writeJsonStorage(validationKey(), importValidation.value)
  }

  const loadPersistedValidationReport = () => {
    const parsed = readJsonStorage(validationKey(), null)
    return normalizeValidationReport(parsed)
  }

  const setValidationReport = (report) => {
    importValidation.value = normalizeValidationReport(report)
    persistValidationReport()
  }

  const openValidationModal = () => {
    if (!importValidation.value) return
    validationModalOpen.value = true
  }

  const closeValidationModal = () => {
    validationModalOpen.value = false
  }

  const clearValidationReport = () => {
    setValidationReport(null)
  }

  const applyValidationReportFromProject = (reportFromProject) => {
    const backendValidation = normalizeValidationReport(reportFromProject)
    if (backendValidation) {
      setValidationReport(backendValidation)
      return
    }
    if (!importValidation.value) {
      importValidation.value = loadPersistedValidationReport()
    }
  }

  const resetValidationRouteState = () => {
    importValidation.value = null
    validationModalOpen.value = false
  }

  return {
    importValidation,
    validationModalOpen,
    validationSummary,
    validationProblemColumnCount,
    validationProblemColumns,
    validationSummaryLine,
    setValidationReport,
    clearValidationReport,
    openValidationModal,
    closeValidationModal,
    applyValidationReportFromProject,
    formatIssueValue,
    resetValidationRouteState,
  }
}
