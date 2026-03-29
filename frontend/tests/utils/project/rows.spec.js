import { describe, expect, it } from 'vitest'
import { mapApiRows } from '../../../src/utils/project/rows'

describe('project rows utils', () => {
  const columns = [
    { name: 'Region', position: 0 },
    { name: 'Revenue', position: 1 },
  ]

  it('maps valid JSON row values', () => {
    const mapped = mapApiRows([
      { id: 10, values: '["North",100]' },
    ], columns)

    expect(mapped).toEqual([
      { id: 10, col_0: 'North', col_1: 100 },
    ])
  })

  it('keeps mapping stable when row values JSON is malformed', () => {
    const mapped = mapApiRows([
      { id: 11, values: '{bad-json' },
    ], columns)

    expect(mapped).toEqual([
      { id: 11, col_0: null, col_1: null },
    ])
  })
})
