import { computed, onBeforeUnmount, reactive } from 'vue'

function cleanCell(value) {
  if (value === null || value === undefined) return '-'
  return String(value).replace(/\r?\n/g, ' ').replace(/\t/g, ' ').trim()
}

function tableToText(headers, rows) {
  const headRow = headers.map((cell) => cleanCell(cell)).join('\t')
  const bodyRows = rows.map((row) => row.map((cell) => cleanCell(cell)).join('\t'))
  return [headRow, ...bodyRows].join('\n')
}

export function useStatisticsResultsCopy(props, t) {
  const copyStatus = reactive({
    numeric: '',
    category: '',
    date: '',
    ordered: '',
    grouped: '',
  })
  const copyStatusTimers = {}

  const canCopyNumeric = computed(() => Boolean(
    props.selectedNumericColumns.length
      && props.selectedNumericMetricKeys.length
      && props.numericMatrix.rows.length
  ))

  const canCopyCategory = computed(() => Boolean(
    props.selectedCategoryColumns.length
      && props.selectedCategoryMetricKeys.length
      && props.categorySummaries.length
  ))

  const canCopyDate = computed(() => Boolean(
    props.selectedDateColumns.length
      && props.selectedDateMetricKeys.length
      && props.dateSummaries.length
  ))

  const canCopyOrdered = computed(() => Boolean(
    props.selectedOrderedColumns.length
      && props.selectedOrderedMetricKeys.length
      && props.orderedSummaries.length
  ))

  const canCopyGrouped = computed(() => Boolean(
    props.groupByColumnId
      && props.selectedNumericColumns.length
      && props.groupedSummaryRows.length
  ))

  const summaryCopyKey = (group, columnId) => `${group}-column-${columnId}`
  const isCopied = (blockKey) => copyStatus[blockKey] === 'copied'
  const isCopyFailed = (blockKey) => copyStatus[blockKey] === 'failed'

  const copyButtonLabel = (blockKey) => {
    if (isCopied(blockKey)) return t('statistics.results.copy.copied')
    if (isCopyFailed(blockKey)) return t('statistics.results.copy.failed')
    if (copyStatus[blockKey] === 'empty') return t('statistics.results.copy.noData')
    return t('statistics.results.copy.default')
  }

  const formatMaybeValue = (value) => (props.hasValue(value) ? props.formatValue(value) : '-')

  const formatMedianRank = (summary) => {
    if (!props.hasValue(summary.medianRank)) return '-'
    const rank = props.formatValue(summary.medianRank)
    if (!props.hasValue(summary.medianRankLabel)) return rank
    return `${rank} (${props.formatValue(summary.medianRankLabel)})`
  }

  const frequencyHeaders = () => ([
    t('statistics.results.tables.value'),
    t('statistics.results.tables.count'),
    t('statistics.results.tables.percent'),
  ])

  const buildFrequencyRows = (summary) => (summary?.frequencyRows || []).map((row) => [
    props.formatValue(row.value),
    props.formatValue(row.count),
    props.hasValue(row.percent) ? props.formatPercent(row.percent) : '-',
  ])

  const buildFrequencySectionText = (summary) => {
    if (!summary?.frequencyRows?.length) {
      return [
        frequencyHeaders().join('\t'),
        `${t('statistics.results.empty.noDistribution')}\t-\t-`,
      ].join('\n')
    }

    return tableToText(frequencyHeaders(), buildFrequencyRows(summary))
  }

  const buildNumericCopyText = () => {
    if (!canCopyNumeric.value) return ''

    const headers = [
      t('statistics.results.tables.measure'),
      ...props.numericMatrix.columns.map((column) => column.name),
    ]
    const rows = props.numericMatrix.rows.map((row) => [
      props.metricLabel(row.key),
      ...row.values.map((cell) => props.formatValue(cell.value)),
    ])

    return tableToText(headers, rows)
  }

  const buildSummaryTableText = (headerRows) => tableToText([
    t('statistics.results.tables.field'),
    t('statistics.results.tables.value'),
  ], headerRows)

  const buildCategoryCopyText = () => {
    if (!canCopyCategory.value) return ''

    const includeDistinctCount = props.selectedCategoryMetricKeys.includes('distinct_count')
    const includeMode = props.selectedCategoryMetricKeys.includes('mode')
    const includeCount = props.selectedCategoryMetricKeys.includes('count')
    const includeFrequency = props.selectedCategoryMetricKeys.includes('frequency')

    const headers = [t('statistics.results.tables.column')]
    if (includeDistinctCount) headers.push(t('statistics.results.tables.distinctCategories'))
    if (includeMode) headers.push(t('statistics.results.tables.mostFrequentValue'))
    if (includeCount) headers.push(t('statistics.results.tables.count'))

    const rows = props.categorySummaries.map((summary) => {
      const row = [summary.columnName]
      if (includeDistinctCount) row.push(formatMaybeValue(summary.distinctCount))
      if (includeMode) row.push(formatMaybeValue(summary.mode))
      if (includeCount) row.push(formatMaybeValue(summary.count))
      return row
    })

    const sections = [tableToText(headers, rows)]
    if (includeFrequency) {
      props.categorySummaries.forEach((summary) => {
        sections.push(t('statistics.results.tables.topValuesFor', { column: cleanCell(summary.columnName) }))
        sections.push(buildFrequencySectionText(summary))
      })
    }

    return sections.join('\n\n')
  }

  const buildCategorySummaryCopyText = (summary) => {
    if (!summary) return ''

    const metricRows = [[t('statistics.results.tables.column'), summary.columnName]]
    if (props.selectedCategoryMetricKeys.includes('distinct_count') && props.hasValue(summary.distinctCount)) {
      metricRows.push([t('statistics.results.tables.distinctCategories'), props.formatValue(summary.distinctCount)])
    }
    if (props.selectedCategoryMetricKeys.includes('mode') && props.hasValue(summary.mode)) {
      metricRows.push([t('statistics.results.tables.mostFrequentValue'), props.formatValue(summary.mode)])
    }
    if (props.selectedCategoryMetricKeys.includes('count') && props.hasValue(summary.count)) {
      metricRows.push([t('statistics.results.tables.count'), props.formatValue(summary.count)])
    }

    const sections = [buildSummaryTableText(metricRows)]
    if (props.selectedCategoryMetricKeys.includes('frequency')) {
      sections.push(buildFrequencySectionText(summary))
    }

    return sections.filter(Boolean).join('\n\n')
  }

  const buildDateCopyText = () => {
    if (!canCopyDate.value) return ''

    const includeEarliest = props.selectedDateMetricKeys.includes('earliest')
    const includeLatest = props.selectedDateMetricKeys.includes('latest')
    const includeRange = props.selectedDateMetricKeys.includes('range_seconds')
    const includeCount = props.selectedDateMetricKeys.includes('count')

    const headers = [t('statistics.results.tables.column')]
    if (includeEarliest) headers.push(t('statistics.results.tables.earliest'))
    if (includeLatest) headers.push(t('statistics.results.tables.latest'))
    if (includeRange) headers.push(t('statistics.results.tables.range'))
    if (includeCount) headers.push(t('statistics.results.tables.count'))

    const rows = props.dateSummaries.map((summary) => {
      const row = [summary.columnName]
      if (includeEarliest) row.push(formatMaybeValue(summary.earliest))
      if (includeLatest) row.push(formatMaybeValue(summary.latest))
      if (includeRange) row.push(props.hasValue(summary.rangeSeconds) ? props.formatRangeSeconds(summary.rangeSeconds) : '-')
      if (includeCount) row.push(formatMaybeValue(summary.count))
      return row
    })

    return tableToText(headers, rows)
  }

  const buildDateSummaryCopyText = (summary) => {
    if (!summary) return ''

    const metricRows = [[t('statistics.results.tables.column'), summary.columnName]]
    if (props.selectedDateMetricKeys.includes('earliest') && props.hasValue(summary.earliest)) {
      metricRows.push([t('statistics.results.tables.earliest'), props.formatValue(summary.earliest)])
    }
    if (props.selectedDateMetricKeys.includes('latest') && props.hasValue(summary.latest)) {
      metricRows.push([t('statistics.results.tables.latest'), props.formatValue(summary.latest)])
    }
    if (props.selectedDateMetricKeys.includes('range_seconds') && props.hasValue(summary.rangeSeconds)) {
      metricRows.push([t('statistics.results.tables.range'), props.formatRangeSeconds(summary.rangeSeconds)])
    }
    if (props.selectedDateMetricKeys.includes('count') && props.hasValue(summary.count)) {
      metricRows.push([t('statistics.results.tables.count'), props.formatValue(summary.count)])
    }

    return buildSummaryTableText(metricRows)
  }

  const buildOrderedCopyText = () => {
    if (!canCopyOrdered.value) return ''

    const includeMode = props.selectedOrderedMetricKeys.includes('mode')
    const includeMedianRank = props.selectedOrderedMetricKeys.includes('median_rank')
    const includeCount = props.selectedOrderedMetricKeys.includes('count')
    const includeFrequency = props.selectedOrderedMetricKeys.includes('frequency')

    const headers = [t('statistics.results.tables.column')]
    if (includeMode) headers.push(t('statistics.results.tables.mode'))
    if (includeMedianRank) headers.push(t('statistics.results.tables.medianRank'))
    if (includeCount) headers.push(t('statistics.results.tables.count'))

    const rows = props.orderedSummaries.map((summary) => {
      const row = [summary.columnName]
      if (includeMode) row.push(formatMaybeValue(summary.mode))
      if (includeMedianRank) row.push(formatMedianRank(summary))
      if (includeCount) row.push(formatMaybeValue(summary.count))
      return row
    })

    const sections = [tableToText(headers, rows)]
    if (includeFrequency) {
      props.orderedSummaries.forEach((summary) => {
        sections.push(t('statistics.results.tables.topValuesFor', { column: cleanCell(summary.columnName) }))
        sections.push(buildFrequencySectionText(summary))
      })
    }

    return sections.join('\n\n')
  }

  const buildOrderedSummaryCopyText = (summary) => {
    if (!summary) return ''

    const metricRows = [[t('statistics.results.tables.column'), summary.columnName]]
    if (props.selectedOrderedMetricKeys.includes('mode') && props.hasValue(summary.mode)) {
      metricRows.push([t('statistics.results.tables.mode'), props.formatValue(summary.mode)])
    }
    if (props.selectedOrderedMetricKeys.includes('median_rank') && props.hasValue(summary.medianRank)) {
      metricRows.push([t('statistics.results.tables.medianRank'), formatMedianRank(summary)])
    }
    if (props.selectedOrderedMetricKeys.includes('count') && props.hasValue(summary.count)) {
      metricRows.push([t('statistics.results.tables.count'), props.formatValue(summary.count)])
    }

    const sections = [buildSummaryTableText(metricRows)]
    if (props.selectedOrderedMetricKeys.includes('frequency')) {
      sections.push(buildFrequencySectionText(summary))
    }

    return sections.filter(Boolean).join('\n\n')
  }

  const buildGroupedCopyText = () => {
    if (!canCopyGrouped.value) return ''

    const headers = [
      t('statistics.results.tables.variable'),
      t('statistics.results.tables.group'),
      ...props.groupedMetricKeys.map((metric) => props.metricLabel(metric)),
    ]
    const rows = props.groupedSummaryRows.map((row) => [
      row.column,
      row.group,
      ...props.groupedMetricKeys.map((metric) => props.formatValue(row.metrics?.[metric])),
    ])

    return tableToText(headers, rows)
  }

  const buildCopyText = (blockKey) => {
    if (blockKey === 'numeric') return buildNumericCopyText()
    if (blockKey === 'category') return buildCategoryCopyText()
    if (blockKey === 'date') return buildDateCopyText()
    if (blockKey === 'ordered') return buildOrderedCopyText()
    if (blockKey === 'grouped') return buildGroupedCopyText()
    return ''
  }

  const buildSummaryCopyText = (group, summary) => {
    if (!summary) return ''
    if (group === 'category') return buildCategorySummaryCopyText(summary)
    if (group === 'date') return buildDateSummaryCopyText(summary)
    if (group === 'ordered') return buildOrderedSummaryCopyText(summary)
    return ''
  }

  const setCopyStatus = (blockKey, message) => {
    if (copyStatusTimers[blockKey]) {
      clearTimeout(copyStatusTimers[blockKey])
    }

    copyStatus[blockKey] = message
    copyStatusTimers[blockKey] = setTimeout(() => {
      copyStatus[blockKey] = ''
      delete copyStatusTimers[blockKey]
    }, 1800)
  }

  const writeToClipboardFallback = (text) => {
    if (typeof document === 'undefined' || !document.body) return false

    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.left = '-9999px'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()

    try {
      return document.execCommand('copy')
    } catch {
      return false
    } finally {
      document.body.removeChild(textarea)
    }
  }

  const writeToClipboard = async (text) => {
    if (
      typeof navigator !== 'undefined'
      && navigator.clipboard
      && typeof navigator.clipboard.writeText === 'function'
    ) {
      try {
        await navigator.clipboard.writeText(text)
        return true
      } catch {
        // Fall through to execCommand fallback.
      }
    }

    return writeToClipboardFallback(text)
  }

  const copyBlock = async (blockKey) => {
    const text = buildCopyText(blockKey)
    if (!text) {
      setCopyStatus(blockKey, 'empty')
      return
    }

    const copied = await writeToClipboard(text)
    setCopyStatus(blockKey, copied ? 'copied' : 'failed')
  }

  const copySummary = async (group, summary) => {
    const copyKey = summaryCopyKey(group, summary?.columnId)
    const text = buildSummaryCopyText(group, summary)
    if (!text) {
      setCopyStatus(copyKey, 'empty')
      return
    }

    const copied = await writeToClipboard(text)
    setCopyStatus(copyKey, copied ? 'copied' : 'failed')
  }

  const canCopyCategorySummary = (summary) => Boolean(summary && buildCategorySummaryCopyText(summary))
  const canCopyDateSummary = (summary) => Boolean(summary && buildDateSummaryCopyText(summary))
  const canCopyOrderedSummary = (summary) => Boolean(summary && buildOrderedSummaryCopyText(summary))

  onBeforeUnmount(() => {
    Object.values(copyStatusTimers).forEach((timerId) => clearTimeout(timerId))
  })

  return {
    copyStatus,
    canCopyNumeric,
    canCopyCategory,
    canCopyDate,
    canCopyOrdered,
    canCopyGrouped,
    summaryCopyKey,
    isCopied,
    isCopyFailed,
    copyButtonLabel,
    canCopyCategorySummary,
    canCopyDateSummary,
    canCopyOrderedSummary,
    copyBlock,
    copySummary,
    buildCopyText,
    buildSummaryCopyText,
    buildNumericCopyText,
    buildCategoryCopyText,
    buildCategorySummaryCopyText,
    buildDateCopyText,
    buildDateSummaryCopyText,
    buildOrderedCopyText,
    buildOrderedSummaryCopyText,
    buildGroupedCopyText,
    formatMedianRank,
    formatMaybeValue,
    buildFrequencySectionText,
    tableToText,
    cleanCell,
    writeToClipboard,
    writeToClipboardFallback,
    setCopyStatus,
  }
}
