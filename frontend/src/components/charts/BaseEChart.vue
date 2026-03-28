<template>
  <div ref="rootEl" class="base-echart"></div>
</template>

<script>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
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
import { LegacyGridContainLabel } from 'echarts/features'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([
  LineChart,
  BarChart,
  PieChart,
  ScatterChart,
  BoxplotChart,
  GridComponent,
  LegacyGridContainLabel,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  DatasetComponent,
  TransformComponent,
  CanvasRenderer,
])

export default {
  name: 'BaseEChart',
  props: {
    option: {
      type: Object,
      default: () => ({}),
    },
  },
  setup(props, { expose }) {
    const rootEl = ref(null)
    let chart = null
    let resizeObserver = null
    let resizeFrameId = null

    const getRootSize = () => {
      const el = rootEl.value
      if (!el) return { width: 0, height: 0 }
      const rect = typeof el.getBoundingClientRect === 'function' ? el.getBoundingClientRect() : null
      const width = Number(rect?.width ?? el.clientWidth ?? 0)
      const height = Number(rect?.height ?? el.clientHeight ?? 0)
      return { width, height }
    }

    const hasRenderableSize = () => {
      const { width, height } = getRootSize()
      return width > 0 && height > 0
    }

    const applyOption = () => {
      if (!chart) return
      const option = props.option && typeof props.option === 'object' ? props.option : {}
      chart.clear()
      if (Object.keys(option).length) {
        chart.setOption(option, true)
      }
    }

    const initChartIfReady = () => {
      if (chart || !rootEl.value) return Boolean(chart)
      if (!hasRenderableSize()) return false
      chart = echarts.init(rootEl.value)
      applyOption()
      return true
    }

    const resize = () => {
      if (!chart) return
      if (!hasRenderableSize()) return
      chart.resize()
    }

    const scheduleInitOrResize = () => {
      if (resizeFrameId !== null) return
      resizeFrameId = requestAnimationFrame(() => {
        resizeFrameId = null
        if (!chart) {
          initChartIfReady()
          return
        }
        resize()
      })
    }

    const exportPng = (filename = 'chart.png') => {
      if (!chart) return false
      const url = chart.getDataURL({
        type: 'png',
        pixelRatio: 2,
        backgroundColor: '#111111',
      })
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      link.click()
      return true
    }

    onMounted(() => {
      if (!rootEl.value) return
      scheduleInitOrResize()

      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => scheduleInitOrResize())
        resizeObserver.observe(rootEl.value)
      }

      window.addEventListener('resize', scheduleInitOrResize)
    })

    watch(
      () => props.option,
      () => {
        if (!chart) {
          scheduleInitOrResize()
          return
        }
        applyOption()
      },
      { deep: false }
    )

    onBeforeUnmount(() => {
      window.removeEventListener('resize', scheduleInitOrResize)
      if (resizeObserver) {
        resizeObserver.disconnect()
        resizeObserver = null
      }
      if (resizeFrameId !== null) {
        cancelAnimationFrame(resizeFrameId)
        resizeFrameId = null
      }
      if (chart) {
        chart.dispose()
        chart = null
      }
    })

    expose({
      resize,
      exportPng,
      getInstance: () => chart,
    })

    return { rootEl }
  },
}
</script>

<style scoped>
.base-echart {
  width: 100%;
  height: 100%;
  min-height: 160px;
}
</style>
