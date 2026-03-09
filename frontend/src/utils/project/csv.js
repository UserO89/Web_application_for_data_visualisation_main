export const escCsv = (value) => {
  const stringValue = String(value ?? '')
  return /[",\n\r]/.test(stringValue) ? `"${stringValue.replace(/"/g, '""')}"` : stringValue
}

export const normalizeHeaders = (headers = []) => {
  const used = new Map()
  return headers.map((header, index) => {
    const base = (header || '').trim() || `Column ${index + 1}`
    const count = used.get(base) || 0
    used.set(base, count + 1)
    return count === 0 ? base : `${base} (${count + 1})`
  })
}

export const buildCsvLines = ({ headers = [], rows = [], mapRowToValues = null } = {}) => {
  const lines = [headers.map(escCsv).join(',')]
  rows.forEach((row) => {
    const values = typeof mapRowToValues === 'function'
      ? mapRowToValues(row, headers)
      : headers.map((_, index) => row?.[index] ?? '')
    lines.push(values.map(escCsv).join(','))
  })
  return lines
}
