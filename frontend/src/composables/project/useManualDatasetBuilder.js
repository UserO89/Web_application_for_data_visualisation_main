import { ref } from 'vue'
import { buildCsvLines, createManualRow, normalizeHeaders } from '../../utils/project'

const DEFAULT_HEADERS = ['Column 1', 'Column 2', 'Column 3']
const DEFAULT_ROW_COUNT = 4

const buildDefaultRows = (columnCount = DEFAULT_HEADERS.length) =>
  Array.from({ length: DEFAULT_ROW_COUNT }, () => createManualRow(columnCount))

export const useManualDatasetBuilder = () => {
  const manualHeaders = ref([...DEFAULT_HEADERS])
  const manualRowsInput = ref(buildDefaultRows())
  const manualError = ref('')

  const addManualColumn = () => {
    manualHeaders.value.push(`Column ${manualHeaders.value.length + 1}`)
    manualRowsInput.value = manualRowsInput.value.map((row) => [...row, ''])
  }

  const removeManualColumn = () => {
    if (manualHeaders.value.length <= 1) return
    manualHeaders.value.pop()
    manualRowsInput.value = manualRowsInput.value.map((row) =>
      row.slice(0, manualHeaders.value.length)
    )
  }

  const addManualRow = () => {
    manualRowsInput.value.push(createManualRow(manualHeaders.value.length))
  }

  const removeManualRow = () => {
    if (manualRowsInput.value.length <= 1) return
    manualRowsInput.value.pop()
  }

  const resetManualBuilder = () => {
    manualHeaders.value = [...DEFAULT_HEADERS]
    manualRowsInput.value = buildDefaultRows()
    manualError.value = ''
  }

  const prepareManualImportFile = () => {
    manualError.value = ''

    if (!manualHeaders.value.length) {
      manualError.value = 'Add at least one column.'
      return null
    }
    if (!manualRowsInput.value.length) {
      manualError.value = 'Add at least one row.'
      return null
    }

    const hasData = manualRowsInput.value.some((row) =>
      row.some((cell) => String(cell || '').trim() !== '')
    )
    if (!hasData) {
      manualError.value = 'Fill at least one cell before creating the table.'
      return null
    }

    const headers = normalizeHeaders(manualHeaders.value)
    const lines = buildCsvLines({
      headers,
      rows: manualRowsInput.value,
    })

    return new File([lines.join('\n')], 'manual_dataset.csv', { type: 'text/csv' })
  }

  return {
    manualHeaders,
    manualRowsInput,
    manualError,
    createManualRow,
    addManualColumn,
    removeManualColumn,
    addManualRow,
    removeManualRow,
    resetManualBuilder,
    prepareManualImportFile,
  }
}
