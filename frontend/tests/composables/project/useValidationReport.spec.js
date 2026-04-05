import { ref } from 'vue'
import { useValidationReport } from '../../../src/composables/project/useValidationReport'

const STORAGE_PREFIX = 'dataviz.validation.report.v2.'

const createLocalStorageMock = () => {
  const store = new Map()

  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null
    },
    setItem(key, value) {
      store.set(String(key), String(value))
    },
    removeItem(key) {
      store.delete(String(key))
    },
    clear() {
      store.clear()
    },
  }
}

const buildReport = () => ({
  summary: {
    import_status: 'imported_with_warnings',
    rows_total: 7,
    rows_checked: 7,
    rows_imported: 6,
    rows_skipped: 1,
    columns_detected: 3,
    problematic_columns: 1,
    normalized_cells: 2,
    nullified_cells: 1,
  },
  problem_columns: [
    {
      column_index: 2,
      column_name: 'Revenue',
      issue_count: 1,
      normalized_count: 0,
      nullified_count: 1,
      review_samples: [
        {
          row: 3,
          original_value: 'bad',
          action: 'nullified',
          new_value: null,
          reason: 'Invalid numeric value',
        },
      ],
    },
  ],
  blocking_error: null,
})

describe('useValidationReport', () => {
  let localStorageMock

  beforeEach(() => {
    localStorageMock = createLocalStorageMock()
    vi.stubGlobal('localStorage', localStorageMock)
  })

  afterEach(() => {
    localStorageMock.clear()
    vi.unstubAllGlobals()
  })

  it('normalizes and persists validation reports and exposes computed review state', () => {
    const state = useValidationReport({
      projectId: ref('15'),
    })

    state.setValidationReport(buildReport())

    expect(state.importValidation.value).toMatchObject({
      summary: {
        rows_imported: 6,
        rows_skipped: 1,
        problematic_columns: 1,
      },
    })
    expect(state.hasValidationReport.value).toBe(true)
    expect(state.validationProblemColumnCount.value).toBe(1)
    expect(state.validationProblemColumns.value).toHaveLength(1)
    expect(state.validationBlockingError.value).toBeNull()
    expect(state.validationSummaryLine.value).toBe('6 imported, 1 skipped, 1 problematic columns, 2 normalized, 1 may become null.')
    expect(localStorage.getItem(`${STORAGE_PREFIX}15`)).toContain('"rows_imported":6')
  })

  it('opens and closes the validation modal only when a report exists', () => {
    const state = useValidationReport({
      projectId: ref('21'),
    })

    state.openValidationModal()
    expect(state.validationModalOpen.value).toBe(false)

    state.setValidationReport(buildReport())
    state.openValidationModal()
    expect(state.validationModalOpen.value).toBe(true)

    state.closeValidationModal()
    expect(state.validationModalOpen.value).toBe(false)
  })

  it('clears the report, resets modal state, and removes persisted storage', () => {
    const state = useValidationReport({
      projectId: ref('22'),
    })

    state.setValidationReport(buildReport())
    state.openValidationModal()
    state.clearValidationReport()

    expect(state.importValidation.value).toBeNull()
    expect(state.validationModalOpen.value).toBe(false)
    expect(localStorage.getItem(`${STORAGE_PREFIX}22`)).toBeNull()
  })

  it('applies backend validation first and otherwise falls back to persisted storage', () => {
    const state = useValidationReport({
      projectId: ref('23'),
    })

    localStorage.setItem(`${STORAGE_PREFIX}23`, JSON.stringify(buildReport()))
    state.applyValidationReportFromProject(null)
    expect(state.importValidation.value).toMatchObject({
      summary: {
        rows_imported: 6,
      },
    })

    state.resetValidationRouteState()
    state.applyValidationReportFromProject({
      summary: {
        rows_imported: 3,
        rows_skipped: 0,
      },
      problem_columns: [],
    })
    expect(state.importValidation.value).toMatchObject({
      summary: {
        rows_imported: 3,
        rows_skipped: 0,
      },
    })
  })

  it('resets transient route state without touching persisted storage', () => {
    const state = useValidationReport({
      projectId: ref('24'),
    })

    state.setValidationReport(buildReport())
    state.openValidationModal()
    state.resetValidationRouteState()

    expect(state.importValidation.value).toBeNull()
    expect(state.validationModalOpen.value).toBe(false)
    expect(localStorage.getItem(`${STORAGE_PREFIX}24`)).not.toBeNull()
  })
})
