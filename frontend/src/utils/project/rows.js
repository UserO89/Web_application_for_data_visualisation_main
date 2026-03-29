import { cellField } from './fields'

const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key)

export const readRowValue = (values, position, columnName) => {
  if (Array.isArray(values)) {
    return position < values.length ? values[position] : null
  }
  if (values && typeof values === 'object') {
    if (hasOwn(values, position)) return values[position]
    if (hasOwn(values, String(position))) return values[String(position)]
    if (hasOwn(values, columnName)) return values[columnName]
  }
  return null
}

const parseRowValues = (rawValues) => {
  if (typeof rawValues !== 'string') {
    return rawValues || {}
  }

  try {
    const parsed = JSON.parse(rawValues)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch (_) {
    return {}
  }
}

export const mapApiRows = (rows, columns) =>
  rows.map((row) => {
    const values = parseRowValues(row.values)
    const mapped = { id: row.id }
    columns.forEach((col) => {
      const position = Number(col.position)
      const value = readRowValue(values, position, col.name)
      mapped[cellField(position)] = value === undefined ? null : value
    })
    return mapped
  })

export const buildRowUpdateValues = (row, columns, { emptyStringAsNull = false } = {}) =>
  columns.map((col) => {
    const value = row[cellField(col.position)]
    if (emptyStringAsNull && value === '') return null
    return value ?? null
  })

export const unpackRowsPayload = (payload) => ({
  rows: Array.isArray(payload) ? payload : (payload?.data || []),
  lastPage: Array.isArray(payload) ? null : Number(payload?.last_page || 0),
  isPaginated: !Array.isArray(payload),
})
