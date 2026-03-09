export const createManualRow = (columnCount) =>
  Array.from({ length: Math.max(0, Number(columnCount) || 0) }, () => '')
