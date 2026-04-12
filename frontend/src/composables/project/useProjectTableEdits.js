import { computed, nextTick, ref } from 'vue'
import { projectsApi } from '../../api/projects'
import { buildRowUpdateValues } from '../../utils/project'
import { extractApiErrorMessage } from '../../utils/api/errors'

export function useProjectTableEdits({
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
  apiClient = projectsApi,
}) {
  const tableSaving = ref(false)
  const tableEditing = ref(false)
  const pendingTableRows = ref(new Map())
  const tableHasUnsavedChanges = computed(() => pendingTableRows.value.size > 0)

  const replaceLocalRow = (rowsRef, nextRow) => {
    if (!nextRow?.id || !Array.isArray(rowsRef.value) || !rowsRef.value.length) return

    let hasMatch = false
    const updatedRows = rowsRef.value.map((row) => {
      if (Number(row?.id) !== Number(nextRow.id)) return row
      hasMatch = true
      return nextRow
    })

    if (hasMatch) {
      rowsRef.value = updatedRows
    }
  }

  const setPendingTableRow = (nextRow) => {
    if (!nextRow?.id) return

    const updatedPendingRows = new Map(pendingTableRows.value)
    updatedPendingRows.set(Number(nextRow.id), { ...nextRow })
    pendingTableRows.value = updatedPendingRows
  }

  const clearPendingTableChanges = () => {
    pendingTableRows.value = new Map()
    tableSaving.value = false
    tableEditing.value = false
  }

  const applyPendingTableRows = (rowsRef) => {
    if (!Array.isArray(rowsRef.value) || !rowsRef.value.length || !pendingTableRows.value.size) return

    rowsRef.value = rowsRef.value.map((row) => {
      const pendingRow = pendingTableRows.value.get(Number(row?.id))
      return pendingRow ? { ...row, ...pendingRow } : row
    })
  }

  const handleCellEdit = async (data) => {
    if (isReadOnly.value) {
      notify.info(t('project.page.readOnly.tableEditsDisabled'))
      return
    }

    const nextRow = { ...data.row }

    if (nextRow) {
      replaceLocalRow(tableRows, nextRow)
      replaceLocalRow(analysisRows, nextRow)
      setPendingTableRow(nextRow)
    }

    tableEditing.value = false

    if (analysisRowsReady.value) {
      scheduleBuildChart(chartDefinition.value)
    }
  }

  const handleSaveTable = async () => {
    if (isReadOnly.value) {
      notify.info(t('project.page.readOnly.tableEditsDisabled'))
      return
    }
    await nextTick()
    if (!tableHasUnsavedChanges.value || tableSaving.value) return

    tableSaving.value = true
    const rowsToSave = Array.from(pendingTableRows.value.values())

    try {
      for (const row of rowsToSave) {
        const values = buildRowUpdateValues(row, sortedDatasetColumns.value)
        await apiClient.updateRow(projectId.value, row.id, values)

        const updatedPendingRows = new Map(pendingTableRows.value)
        updatedPendingRows.delete(Number(row.id))
        pendingTableRows.value = updatedPendingRows
      }

      await refreshData()
      notify.success(t('project.page.dataset.tableSaved'))
    } catch (error) {
      notify.error(extractApiErrorMessage(error, t('project.page.dataset.tableSaveFailed')))
    } finally {
      tableSaving.value = false
    }
  }

  return {
    tableSaving,
    tableEditing,
    tableHasUnsavedChanges,
    clearPendingTableChanges,
    applyPendingTableRows,
    handleCellEdit,
    handleSaveTable,
  }
}
