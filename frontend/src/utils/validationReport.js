const DEFAULT_SUMMARY = {
  import_status: 'imported_clean',
  rows_total: 0,
  rows_checked: 0,
  rows_imported: 0,
  rows_skipped: 0,
  columns_detected: 0,
  problematic_columns: 0,
  normalized_cells: 0,
  nullified_cells: 0,
}

export const normalizeValidationReport = (report) => {
  if (!report || typeof report !== 'object') return null

  const summary = normalizeSummary(report.summary || {})
  const problemColumns = normalizeProblemColumns(report.problem_columns)

  if (summary.problematic_columns <= 0) {
    summary.problematic_columns = problemColumns.length
  }

  return {
    summary,
    dataset: report.dataset || {},
    problem_columns: problemColumns,
    blocking_error: report.blocking_error || null,
  }
}

const normalizeSummary = (summary = {}) => {
  const merged = { ...DEFAULT_SUMMARY, ...(summary || {}) }

  merged.rows_total = numberOrZero(merged.rows_total)
  merged.rows_checked = numberOrZero(merged.rows_checked) || merged.rows_total
  merged.rows_imported = numberOrZero(merged.rows_imported)
  merged.rows_skipped = numberOrZero(merged.rows_skipped)
  merged.columns_detected = numberOrZero(merged.columns_detected)
  merged.problematic_columns = numberOrZero(merged.problematic_columns)
  merged.normalized_cells = numberOrZero(merged.normalized_cells)
  merged.nullified_cells = numberOrZero(merged.nullified_cells)

  return merged
}

const normalizeProblemColumns = (columns) => {
  if (!Array.isArray(columns)) return []

  const normalized = columns.map((column) => ({
    column_index: numberOrZero(column?.column_index ?? column?.columnIndex),
    column_name: String(column?.column_name ?? column?.name ?? 'Unknown'),
    issue_count: numberOrZero(column?.issue_count),
    normalized_count: numberOrZero(column?.normalized_count),
    nullified_count: numberOrZero(column?.nullified_count),
    review_samples: normalizeReviewSamples(column?.review_samples),
  }))

  return normalized.sort((a, b) => {
    if (a.issue_count !== b.issue_count) return b.issue_count - a.issue_count
    if (a.nullified_count !== b.nullified_count) return b.nullified_count - a.nullified_count
    return a.column_name.localeCompare(b.column_name)
  })
}

const normalizeReviewSamples = (samples) => {
  if (!Array.isArray(samples)) return []

  return samples
    .map((sample) => ({
      row: numberOrZero(sample?.row),
      original_value: sample?.original_value ?? null,
      action: sample?.action === 'nullified' ? 'nullified' : 'normalized',
      new_value: sample?.new_value ?? null,
      reason: String(sample?.reason || 'Value normalized'),
    }))
    .filter((sample) => sample.row > 0)
}

const numberOrZero = (value) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

