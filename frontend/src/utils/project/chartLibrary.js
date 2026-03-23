import * as echarts from 'echarts/core'
import { LineChart, BarChart, PieChart, ScatterChart, BoxplotChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  DatasetComponent,
  TransformComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { buildEChartOption } from '../../charts/chartTransformers/chartDefinitionToEChartsOption'

echarts.use([
  LineChart,
  BarChart,
  PieChart,
  ScatterChart,
  BoxplotChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  DatasetComponent,
  TransformComponent,
  CanvasRenderer,
])

const sanitizeFileName = (name) =>
  String(name || 'chart')
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 80) || 'chart'

export const downloadSavedChartPng = async (renderedChart, title = 'chart') => {
  const definition = {
    type: renderedChart?.type || 'line',
    labels: Array.isArray(renderedChart?.labels) ? renderedChart.labels : [],
    datasets: Array.isArray(renderedChart?.datasets) ? renderedChart.datasets : [],
    meta: renderedChart?.meta && typeof renderedChart.meta === 'object' ? renderedChart.meta : {},
  }

  const option = buildEChartOption(definition)
  const host = document.createElement('div')
  host.style.width = '1200px'
  host.style.height = '720px'
  host.style.position = 'fixed'
  host.style.left = '-10000px'
  host.style.top = '-10000px'
  document.body.appendChild(host)

  let instance = null

  const disableAnimationAndProgressive = (chartOption) => {
    if (!chartOption || typeof chartOption !== 'object') return chartOption
    chartOption.animation = false
    chartOption.animationDuration = 0
    chartOption.animationDurationUpdate = 0

    const series = Array.isArray(chartOption.series) ? chartOption.series : []
    series.forEach((seriesItem) => {
      if (!seriesItem || typeof seriesItem !== 'object') return
      seriesItem.animation = false
      seriesItem.animationDuration = 0
      seriesItem.animationDurationUpdate = 0
      seriesItem.progressive = 0
      seriesItem.progressiveThreshold = 0
    })
    return chartOption
  }

  const waitForRenderedFrame = (chartInstance) =>
    new Promise((resolve) => {
      let done = false
      const finish = () => {
        if (done) return
        done = true
        try {
          chartInstance.off('finished', onFinished)
        } catch (_) {}
        resolve()
      }
      const onFinished = () => finish()

      try {
        chartInstance.on('finished', onFinished)
      } catch (_) {}

      requestAnimationFrame(() => requestAnimationFrame(finish))
      setTimeout(finish, 450)
    })

  try {
    instance = echarts.init(host, null, { renderer: 'canvas' })
    const exportOption = disableAnimationAndProgressive(option)
    instance.setOption(exportOption, true)
    instance.resize({
      width: 1200,
      height: 720,
      silent: true,
    })
    await waitForRenderedFrame(instance)

    const dataUrl = instance.getDataURL({
      type: 'png',
      pixelRatio: 2,
      backgroundColor: '#111111',
    })

    const link = document.createElement('a')
    link.href = dataUrl
    link.download = `${sanitizeFileName(title)}.png`
    link.click()
  } finally {
    if (instance) {
      instance.dispose()
    }
    if (host.parentNode) {
      host.parentNode.removeChild(host)
    }
  }
}
