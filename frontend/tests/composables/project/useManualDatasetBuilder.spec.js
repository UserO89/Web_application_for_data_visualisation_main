import { useManualDatasetBuilder } from '../../../src/composables/project/useManualDatasetBuilder'

describe('useManualDatasetBuilder', () => {
  it('starts with default headers and default row count', () => {
    const state = useManualDatasetBuilder()

    expect(state.manualHeaders.value).toEqual(['Column 1', 'Column 2', 'Column 3'])
    expect(state.manualRowsInput.value).toHaveLength(4)
    expect(state.manualRowsInput.value[0]).toEqual(['', '', ''])
    expect(state.manualError.value).toBe('')
  })

  it('adds and removes manual columns while keeping row width in sync', () => {
    const state = useManualDatasetBuilder()

    state.addManualColumn()
    expect(state.manualHeaders.value).toEqual(['Column 1', 'Column 2', 'Column 3', 'Column 4'])
    expect(state.manualRowsInput.value.every((row) => Array.isArray(row))).toBe(true)
    expect(state.manualRowsInput.value[0]).toEqual(['', '', '', ''])

    state.removeManualColumn()
    expect(state.manualHeaders.value).toEqual(['Column 1', 'Column 2', 'Column 3'])
    expect(state.manualRowsInput.value[0]).toEqual(['', '', ''])

    state.manualHeaders.value = ['Only column']
    state.manualRowsInput.value = [['one']]
    state.removeManualColumn()
    expect(state.manualHeaders.value).toEqual(['Only column'])
    expect(state.manualRowsInput.value).toEqual([['one']])
  })

  it('adds and removes manual rows with a minimum of one row', () => {
    const state = useManualDatasetBuilder()

    state.manualHeaders.value = ['A', 'B']
    state.manualRowsInput.value = [['1', '2']]

    state.addManualRow()
    expect(state.manualRowsInput.value).toEqual([
      ['1', '2'],
      ['', ''],
    ])

    state.removeManualRow()
    expect(state.manualRowsInput.value).toEqual([['1', '2']])

    state.removeManualRow()
    expect(state.manualRowsInput.value).toEqual([['1', '2']])
  })

  it('returns validation errors when the manual table cannot be created', () => {
    const state = useManualDatasetBuilder()

    state.manualHeaders.value = []
    expect(state.prepareManualImportFile()).toBeNull()
    expect(state.manualError.value).toBe('Add at least one column.')

    state.manualHeaders.value = ['A']
    state.manualRowsInput.value = []
    expect(state.prepareManualImportFile()).toBeNull()
    expect(state.manualError.value).toBe('Add at least one row.')

    state.manualRowsInput.value = [['   '], ['']]
    expect(state.prepareManualImportFile()).toBeNull()
    expect(state.manualError.value).toBe('Fill at least one cell before creating the table.')
  })

  it('builds a CSV file from normalized headers and resets to defaults', async () => {
    const state = useManualDatasetBuilder()

    state.manualHeaders.value = [' Region ', 'Region', '']
    state.manualRowsInput.value = [
      ['North', '100', 'A'],
      ['South', '', 'B'],
    ]

    const file = state.prepareManualImportFile()

    expect(file).toBeInstanceOf(File)
    expect(file.name).toBe('manual_dataset.csv')
    expect(file.type).toBe('text/csv')
    await expect(file.text()).resolves.toBe('Region,Region (2),Column 3\nNorth,100,A\nSouth,,B')
    expect(state.manualError.value).toBe('')

    state.manualError.value = 'Some error'
    state.resetManualBuilder()
    expect(state.manualHeaders.value).toEqual(['Column 1', 'Column 2', 'Column 3'])
    expect(state.manualRowsInput.value).toHaveLength(4)
    expect(state.manualRowsInput.value[0]).toEqual(['', '', ''])
    expect(state.manualError.value).toBe('')
  })
})
