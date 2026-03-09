export const normalizeDraftValue = (value) => {
  if (value === null || value === undefined) return null
  const trimmed = String(value).trim()
  return trimmed === '' ? null : trimmed
}

export const formatIssueValue = (value) => {
  if (value === null || value === undefined || value === '') return 'null'
  return String(value)
}
