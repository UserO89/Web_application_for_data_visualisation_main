import {
  hasValue,
  formatValue,
  formatPercent,
  formatRangeSeconds,
  formatConfidence,
} from '../../../src/utils/statistics/formatters'
import { beforeEach } from 'vitest'
import { setLocale } from '../../../src/i18n'

describe('statistics formatters', () => {
  beforeEach(() => {
    setLocale('en')
  })

  describe('hasValue', () => {
    it('returns false for null and undefined, true for non-empty values', () => {
      expect(hasValue(null)).toBe(false)
      expect(hasValue(undefined)).toBe(false)
      expect(hasValue(0)).toBe(true)
      expect(hasValue('')).toBe(true)
      expect(hasValue(false)).toBe(true)
    })
  })

  describe('formatValue', () => {
    it('formats null, integers, decimals, strings, arrays, and objects', () => {
      expect(formatValue(null)).toBe('-')
      expect(formatValue(1000)).toBe((1000).toLocaleString('en'))
      expect(formatValue(12.34567)).toBe(
        (12.34567).toLocaleString('en', { minimumFractionDigits: 0, maximumFractionDigits: 4 })
      )
      expect(formatValue('North')).toBe('North')
      expect(formatValue([])).toBe('[]')
      expect(formatValue([1, 'a', 3])).toBe('1, a, 3')
      expect(formatValue([{ id: 1 }, { id: 2 }])).toBe('2 rows')
      expect(formatValue({ region: 'North', count: 2 })).toBe('region: North, count: 2')
    })
  })

  describe('formatPercent', () => {
    it('returns dash for invalid input and formatted percent for numeric input', () => {
      expect(formatPercent('abc')).toBe('-')
      expect(formatPercent(undefined)).toBe('-')
      expect(formatPercent(null)).toBe('0%')
      expect(formatPercent(12.345)).toBe(
        `${(12.345).toLocaleString('en', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}%`
      )
    })
  })

  describe('formatRangeSeconds', () => {
    it('formats seconds, minutes, hours, days and handles invalid input', () => {
      expect(formatRangeSeconds('bad')).toBe('-')
      expect(formatRangeSeconds(45)).toBe('45 sec')
      expect(formatRangeSeconds(90)).toBe('1.5 min')
      expect(formatRangeSeconds(7200)).toBe('2 h')
      expect(formatRangeSeconds(172800)).toBe('2 days')
    })
  })

  describe('formatConfidence', () => {
    it('formats numeric confidence and returns n/a for invalid values', () => {
      expect(formatConfidence(0.876)).toBe('88%')
      expect(formatConfidence(0)).toBe('0%')
      expect(formatConfidence('0.5')).toBe('n/a')
      expect(formatConfidence(null)).toBe('n/a')
    })

    it('switches number and unit labels with the active locale', () => {
      setLocale('sk')

      expect(formatValue([{ id: 1 }, { id: 2 }])).toBe('2 riadkov')
      expect(formatRangeSeconds(45)).toBe('45 s')
    })
  })
})
