import {
  normalizeFrequencyRows,
  buildNumericMatrix,
  buildCategorySummaries,
  buildDateSummaries,
  buildOrderedSummaries,
} from '../../../src/statistics/presentation/buildStatisticsSections'

describe('buildStatisticsSections', () => {
  describe('normalizeFrequencyRows', () => {
    it('returns empty array for empty input', () => {
      expect(normalizeFrequencyRows(null)).toEqual([])
      expect(normalizeFrequencyRows(undefined)).toEqual([])
      expect(normalizeFrequencyRows('invalid')).toEqual([])
    })

    it('normalizes array rows, converts 0..1 percent to 0..100, preserves percent above 1, and handles invalid values', () => {
      const input = [
        { value: 'North', count: '2', percent: 0.5 },
        { period: '2024-01', count: 3, percent: 75 },
        { count: 'bad', percent: Number.NaN },
        null,
      ]

      expect(normalizeFrequencyRows(input)).toEqual([
        { value: 'North', count: 2, percent: 50 },
        { value: '2024-01', count: 3, percent: 75 },
        { value: 'Unknown', count: 0, percent: null },
      ])
    })

    it('normalizes object map into value/count/percent rows and handles invalid counts safely', () => {
      const input = {
        North: 2,
        South: '3',
        Unknown: 'bad',
      }

      expect(normalizeFrequencyRows(input)).toEqual([
        { value: 'North', count: 2, percent: null },
        { value: 'South', count: 3, percent: null },
        { value: 'Unknown', count: 0, percent: null },
      ])
    })
  })

  describe('buildNumericMatrix', () => {
    it('expands quartiles and reads values from statsByColumnId by column id while preserving selected columns order', () => {
      const columns = [
        { id: 2, name: 'Second' },
        { id: 1, name: 'First' },
      ]

      const statsByColumnId = new Map([
        [1, { statistics: { count: 8, mean: 20, quartiles: { q1: 11, q2: 12, q3: 13 } } }],
        [2, { statistics: { count: 5, mean: 10, quartiles: { q1: 1, q2: 2, q3: 3 } } }],
      ])

      const matrix = buildNumericMatrix({
        columns,
        metricKeys: ['count', 'quartiles', 'mean'],
        statsByColumnId,
      })

      expect(matrix.columns).toEqual(columns)
      expect(matrix.metricKeys).toEqual(['count', 'quartiles', 'mean'])
      expect(matrix.rows.map((row) => row.key)).toEqual(['count', 'q1', 'q2', 'q3', 'mean'])
      expect(matrix.rows[0].values.map((value) => value.columnId)).toEqual([2, 1])
      expect(matrix.rows[0].values.map((value) => value.value)).toEqual([5, 8])
      expect(matrix.rows[1].values.map((value) => value.value)).toEqual([1, 11])
      expect(matrix.rows[4].values.map((value) => value.value)).toEqual([10, 20])
    })

    it('returns stable structure for empty data', () => {
      expect(buildNumericMatrix({
        columns: null,
        metricKeys: null,
        statsByColumnId: new Map(),
      })).toEqual({
        columns: [],
        metricKeys: [],
        rows: [],
      })
    })
  })

  describe('buildCategorySummaries', () => {
    it('returns count/distinctCount/mode and normalized frequency rows limited to 12 when frequency is selected', () => {
      const columns = [{ id: 1, name: 'Region' }]
      const frequency = Array.from({ length: 20 }, (_, index) => ({
        value: `v-${index + 1}`,
        count: index + 1,
        percent: 0.1,
      }))
      const statsByColumnId = new Map([
        [1, { statistics: { count: 20, distinct_count: 5, mode: 'North', frequency } }],
      ])

      const [summary] = buildCategorySummaries({
        columns,
        metricKeys: ['count', 'distinct_count', 'mode', 'frequency'],
        statsByColumnId,
      })

      expect(summary.count).toBe(20)
      expect(summary.distinctCount).toBe(5)
      expect(summary.mode).toBe('North')
      expect(summary.showFrequency).toBe(true)
      expect(summary.frequencyRows).toHaveLength(12)
      expect(summary.frequencyRows[0]).toEqual({
        value: 'v-1',
        count: 1,
        percent: 10,
      })
    })

    it('returns empty frequency rows when frequency is not selected', () => {
      const columns = [{ id: 1, name: 'Region' }]
      const statsByColumnId = new Map([
        [1, { statistics: { count: 3, distinct_count: 2, mode: 'North', frequency: [{ value: 'North', count: 2 }] } }],
      ])

      const [summary] = buildCategorySummaries({
        columns,
        metricKeys: ['count'],
        statsByColumnId,
      })

      expect(summary.count).toBe(3)
      expect(summary.distinctCount).toBeNull()
      expect(summary.mode).toBeNull()
      expect(summary.showFrequency).toBe(false)
      expect(summary.frequencyRows).toEqual([])
    })
  })

  describe('buildDateSummaries', () => {
    it('returns earliest/latest/rangeSeconds/count and respects selected metric keys', () => {
      const columns = [{ id: 7, name: 'Date' }]
      const statsByColumnId = new Map([
        [7, {
          statistics: {
            count: 4,
            earliest: '2024-01-01T00:00:00+00:00',
            latest: '2024-01-03T00:00:00+00:00',
            range_seconds: 172800,
          },
        }],
      ])

      const [summary] = buildDateSummaries({
        columns,
        metricKeys: ['count', 'earliest'],
        statsByColumnId,
      })

      expect(summary.count).toBe(4)
      expect(summary.earliest).toBe('2024-01-01T00:00:00+00:00')
      expect(summary.latest).toBeNull()
      expect(summary.rangeSeconds).toBeNull()
    })
  })

  describe('buildOrderedSummaries', () => {
    it('returns ordered metrics and includes normalized frequency rows limited to 12 when selected', () => {
      const columns = [{ id: 3, name: 'Priority' }]
      const frequency = Array.from({ length: 15 }, (_, index) => ({
        value: `value-${index + 1}`,
        count: 10 - index,
        percent: 0.25,
      }))
      const statsByColumnId = new Map([
        [3, {
          statistics: {
            count: 10,
            mode: 'Medium',
            median_rank: 2,
            median_rank_label: 'Medium',
            frequency,
          },
        }],
      ])

      const [summary] = buildOrderedSummaries({
        columns,
        metricKeys: ['count', 'mode', 'median_rank', 'frequency'],
        statsByColumnId,
      })

      expect(summary.count).toBe(10)
      expect(summary.mode).toBe('Medium')
      expect(summary.medianRank).toBe(2)
      expect(summary.medianRankLabel).toBe('Medium')
      expect(summary.showFrequency).toBe(true)
      expect(summary.frequencyRows).toHaveLength(12)
      expect(summary.frequencyRows[0].percent).toBe(25)
    })
  })
})
