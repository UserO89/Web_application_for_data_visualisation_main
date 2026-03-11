import { calculateNumericMetrics, buildGroupedSummaryRows } from '../../../src/utils/statistics/groupedSummary'

describe('groupedSummary', () => {
  describe('calculateNumericMetrics', () => {
    it('returns correct metrics for deterministic numeric input', () => {
      const metrics = calculateNumericMetrics([1, 2, 3, 4])

      expect(metrics.count).toBe(4)
      expect(metrics.mean).toBeCloseTo(2.5, 10)
      expect(metrics.median).toBeCloseTo(2.5, 10)
      expect(metrics.q1).toBeCloseTo(1.75, 10)
      expect(metrics.q2).toBeCloseTo(2.5, 10)
      expect(metrics.q3).toBeCloseTo(3.25, 10)
      expect(metrics.min).toBe(1)
      expect(metrics.max).toBe(4)
      expect(metrics.range).toBe(3)
      expect(metrics.std_dev).toBeCloseTo(Math.sqrt(1.25), 10)
      expect(metrics.variance).toBeCloseTo(1.25, 10)
    })

    it('returns null-based structure for input without valid finite numbers', () => {
      expect(calculateNumericMetrics([Number.NaN, Number.POSITIVE_INFINITY, null])).toEqual({
        count: 0,
        mean: null,
        median: null,
        q1: null,
        q2: null,
        q3: null,
        min: null,
        max: null,
        range: null,
        std_dev: null,
        variance: null,
      })
    })
  })

  describe('buildGroupedSummaryRows', () => {
    it('groups rows by category, ignores invalid rows, sorts by group, and keeps only selected grouped metric keys', () => {
      const rows = [
        { region: 'B', sales: '10' },
        { region: 'A', sales: '20' },
        { region: 'B', sales: 'bad' },
        { region: '', sales: '99' },
        { region: null, sales: '50' },
        { region: 'A', sales: '30.5' },
        { region: 'A', sales: '40,5' },
        { region: 'C', sales: '50' },
      ]

      const result = buildGroupedSummaryRows({
        rows,
        selectedNumericColumns: [{ name: 'Sales', fieldKey: 'sales' }],
        categoryColumn: { fieldKey: 'region' },
        groupedMetricKeys: ['count', 'mean'],
      })

      expect(result).toHaveLength(3)
      expect(result.map((row) => row.group)).toEqual(['A', 'B', 'C'])
      expect(result.every((row) => row.column === 'Sales')).toBe(true)
      expect(result.every((row) => Object.keys(row.metrics).join(',') === 'count,mean')).toBe(true)

      expect(result[0].metrics.count).toBe(3)
      expect(result[0].metrics.mean).toBeCloseTo(30.3333333333, 8)
      expect(result[1].metrics.count).toBe(1)
      expect(result[1].metrics.mean).toBe(10)
      expect(result[2].metrics.count).toBe(1)
      expect(result[2].metrics.mean).toBe(50)
    })
  })
})
