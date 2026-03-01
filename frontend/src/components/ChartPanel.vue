<template>
  <div :class="['chart-panel', { panel: !embedded, embedded }]">
    <div
      v-if="!embedded"
      style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;"
    >
      <div style="font-weight: 700;">Visualization</div>
      <div style="color: var(--muted); font-size: 13px;">Interactive area</div>
    </div>

    <div ref="canvasHost" class="chart-canvas">
      <canvas ref="canvas"></canvas>
    </div>

    <div class="chart-footer">
      <div style="color: var(--muted); font-size: 13px;">Hover over the chart for details.</div>
      <div style="display: flex; gap: 8px;">
        <button class="btn" type="button" @click="exportPNG">Export PNG</button>
        <button class="btn" @click="$emit('clear')">Clear</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onBeforeUnmount, onMounted, watch } from 'vue'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

const DEFAULT_PALETTE = [
  '#1db954', '#35c9a3', '#4cc9f0', '#4895ef', '#4361ee',
  '#3a0ca3', '#b5179e', '#f72585', '#f15bb5', '#ff8fab',
  '#f8961e', '#f9c74f', '#90be6d', '#43aa8b', '#577590',
]

const fallbackColor = (index) => DEFAULT_PALETTE[index % DEFAULT_PALETTE.length]

const hexToRgba = (hex, alpha) => {
  const normalized = String(hex || '').replace('#', '')
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return `rgba(29, 185, 84, ${alpha})`
  const int = parseInt(normalized, 16)
  const r = (int >> 16) & 255
  const g = (int >> 8) & 255
  const b = int & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export default {
  name: 'ChartPanel',
  props: {
    labels: { type: Array, default: () => [] },
    datasets: { type: Array, default: () => [] },
    type: { type: String, default: 'line' },
    embedded: { type: Boolean, default: false },
  },
  emits: ['clear'],
  setup(props) {
    const canvas = ref(null)
    const canvasHost = ref(null)
    let chart = null
    let resizeObserver = null

    const createChart = () => {
      if (!canvas.value || !props.labels?.length) {
        if (chart) {
          chart.destroy()
          chart = null
        }
        return
      }

      if (chart) chart.destroy()

      const ctx = canvas.value.getContext('2d')
      chart = new Chart(ctx, {
        type: props.type || 'line',
        data: {
          labels: props.labels,
          datasets: props.datasets.map((ds, i) => {
            const color = ds.color || fallbackColor(i)
            if (props.type === 'pie') {
              const size = Array.isArray(ds.data) ? ds.data.length : 1
              const pieColors = Array.from({ length: Math.max(1, size) }, (_, idx) => fallbackColor(i + idx))
              if (ds.color) pieColors[0] = ds.color
              return {
                ...ds,
                borderColor: pieColors,
                backgroundColor: pieColors.map((c) => hexToRgba(c, 0.82)),
                fill: false,
              }
            }
            return {
              ...ds,
              borderColor: color,
              pointBackgroundColor: color,
              pointBorderColor: color,
              backgroundColor: hexToRgba(color, props.type === 'bar' ? 0.42 : 0.2),
              fill: props.type === 'line',
            }
          }),
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: { color: '#b3b3b3' },
            },
            tooltip: {
              backgroundColor: 'rgba(24, 24, 24, 0.95)',
              titleColor: '#ffffff',
              bodyColor: '#b3b3b3',
            },
          },
          scales:
            props.type !== 'pie'
              ? {
                  x: { ticks: { color: '#b3b3b3' }, grid: { color: 'rgba(255, 255, 255, 0.08)' } },
                  y: { ticks: { color: '#b3b3b3' }, grid: { color: 'rgba(255, 255, 255, 0.08)' } },
                }
              : undefined,
        },
      })
    }

    const handleResize = () => {
      if (!chart) return
      chart.resize()
    }

    onMounted(() => {
      createChart()

      if (canvasHost.value && typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => {
          handleResize()
        })
        resizeObserver.observe(canvasHost.value)
      }
    })

    watch([() => props.labels, () => props.datasets, () => props.type], createChart, { deep: true })

    onBeforeUnmount(() => {
      if (resizeObserver) {
        resizeObserver.disconnect()
        resizeObserver = null
      }
      if (chart) {
        chart.destroy()
        chart = null
      }
    })

    const exportPNG = () => {
      if (chart) {
        const url = chart.toBase64Image('image/png')
        const a = document.createElement('a')
        a.href = url
        a.download = 'chart.png'
        a.click()
      }
    }

    return { canvas, canvasHost, exportPNG }
  },
}
</script>

<style scoped>
.chart-panel {
  display: flex;
  flex-direction: column;
  height: 360px;
  min-height: 220px;
}

.chart-panel.embedded {
  height: 100%;
  min-height: 0;
}

.chart-canvas {
  flex: 1;
  min-height: 160px;
  position: relative;
}

.chart-footer {
  display: flex;
  gap: 8px;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
}
</style>
