import { flushPromises, mount } from '@vue/test-utils'
import { StatisticsResults } from '../../../../src/components/project/statistics/index.js'

const buildRichProps = () => ({
  selectedNumericColumns: [{ id: 1, name: 'Revenue' }],
  selectedCategoryColumns: [{ id: 2, name: 'Region' }],
  selectedDateColumns: [{ id: 3, name: 'Created' }],
  selectedOrderedColumns: [{ id: 4, name: 'Priority' }],
  selectedNumericMetricKeys: ['mean', 'count'],
  selectedCategoryMetricKeys: ['distinct_count', 'mode', 'count', 'frequency'],
  selectedDateMetricKeys: ['earliest', 'latest', 'range_seconds', 'count'],
  selectedOrderedMetricKeys: ['mode', 'median_rank', 'count', 'frequency'],
  numericMatrix: {
    columns: [{ id: 1, name: 'Revenue' }],
    rows: [
      { key: 'mean', values: [{ columnId: 1, value: 10 }] },
      { key: 'count', values: [{ columnId: 1, value: 5 }] },
    ],
  },
  categorySummaries: [
    {
      columnId: 2,
      columnName: 'Region',
      distinctCount: 3,
      mode: 'North',
      count: 5,
      showFrequency: true,
      frequencyRows: [
        { value: 'North', count: 3, percent: 60 },
        { value: 'South', count: 2, percent: 40 },
      ],
    },
  ],
  dateSummaries: [
    {
      columnId: 3,
      columnName: 'Created',
      earliest: '2026-01-01',
      latest: '2026-01-31',
      rangeSeconds: 86400,
      count: 5,
    },
  ],
  orderedSummaries: [
    {
      columnId: 4,
      columnName: 'Priority',
      mode: 'High',
      medianRank: 2,
      medianRankLabel: 'Medium',
      count: 5,
      showFrequency: true,
      frequencyRows: [
        { value: 'High', count: 3, percent: 60 },
      ],
    },
  ],
  groupedMetricKeys: ['mean', 'count'],
  groupedSummaryRows: [
    {
      column: 'Revenue',
      group: 'North',
      metrics: {
        mean: 12,
        count: 2,
      },
    },
  ],
  groupByColumnId: 2,
  groupByColumnName: 'Region',
  groupedSourceReady: true,
  groupedSourceLoading: false,
  metricLabel: (key) => `label:${key}`,
  hasValue: (value) => value !== null && value !== undefined && value !== '',
  formatValue: (value) => `fmt:${value}`,
  formatPercent: (value) => `${value}%`,
  formatRangeSeconds: (value) => `${value}s`,
})

describe('StatisticsResults', () => {
  it('renders empty-state hints when required selections are missing', () => {
    const wrapper = mount(StatisticsResults)

    expect(wrapper.text()).toContain('Select at least one numeric column and one numeric measure')
    expect(wrapper.text()).toContain('Select at least one category column')
    expect(wrapper.text()).toContain('Select at least one date column')
    expect(wrapper.text()).toContain('Select at least one ordered column')
    expect(wrapper.text()).toContain('Grouped statistics will appear after you choose a grouping column.')
  })

  it('builds copyable text blocks for numeric, category, date, ordered, and grouped sections', () => {
    const wrapper = mount(StatisticsResults, {
      props: buildRichProps(),
    })

    expect(wrapper.vm.buildNumericCopyText()).toBe(
      'Measure\tRevenue\nlabel:mean\tfmt:10\nlabel:count\tfmt:5'
    )
    expect(wrapper.vm.buildCategoryCopyText()).toContain('Column\tDistinct categories\tMost frequent value\tCount')
    expect(wrapper.vm.buildCategoryCopyText()).toContain('Top values: Region')
    expect(wrapper.vm.buildCategorySummaryCopyText(buildRichProps().categorySummaries[0])).toContain('Distinct categories\tfmt:3')
    expect(wrapper.vm.buildDateCopyText()).toBe(
      'Column\tEarliest\tLatest\tRange\tCount\nCreated\tfmt:2026-01-01\tfmt:2026-01-31\t86400s\tfmt:5'
    )
    expect(wrapper.vm.buildDateSummaryCopyText(buildRichProps().dateSummaries[0])).toContain('Range\t86400s')
    expect(wrapper.vm.buildOrderedCopyText()).toContain('Median rank')
    expect(wrapper.vm.buildOrderedSummaryCopyText(buildRichProps().orderedSummaries[0])).toContain('Median rank\tfmt:2 (fmt:Medium)')
    expect(wrapper.vm.buildGroupedCopyText()).toBe(
      'Variable\tGroup\tlabel:mean\tlabel:count\nRevenue\tNorth\tfmt:12\tfmt:2'
    )
    expect(wrapper.vm.formatMedianRank(buildRichProps().orderedSummaries[0])).toBe('fmt:2 (fmt:Medium)')
    expect(wrapper.vm.formatMaybeValue(null)).toBe('-')
    expect(wrapper.vm.buildFrequencySectionText({ frequencyRows: [] })).toBe(
      'Value\tCount\tPercent\nNo distribution data available.\t-\t-'
    )
    expect(wrapper.vm.cleanCell('a\tb\nc')).toBe('a b c')
  })

  it('copies a block through navigator.clipboard and resets the copied state', async () => {
    vi.useFakeTimers()
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })

    const wrapper = mount(StatisticsResults, {
      props: buildRichProps(),
    })

    await wrapper.vm.copyBlock('numeric')
    await flushPromises()

    expect(writeText).toHaveBeenCalledWith(
      'Measure\tRevenue\nlabel:mean\tfmt:10\nlabel:count\tfmt:5'
    )
    expect(wrapper.vm.copyStatus.numeric).toBe('Copied')

    vi.advanceTimersByTime(1800)
    expect(wrapper.vm.copyStatus.numeric).toBe('')
    vi.useRealTimers()
  })

  it('falls back to document.execCommand for summary copy operations', async () => {
    const wrapper = mount(StatisticsResults, {
      props: buildRichProps(),
    })

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: undefined,
    })
    const execCommandSpy = vi.fn(() => true)
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: execCommandSpy,
    })

    await wrapper.vm.copySummary('category', buildRichProps().categorySummaries[0])

    expect(execCommandSpy).toHaveBeenCalledWith('copy')
    expect(wrapper.vm.copyStatus['category-column-2']).toBe('Copied')
  })
})
