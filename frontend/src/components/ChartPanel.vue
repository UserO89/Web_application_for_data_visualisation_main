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
          datasets: props.datasets.map((ds, i) => ({
            ...ds,
            borderColor: ['#1db954', '#1ed760', '#159947', '#5fcf8a', '#b3b3b3'][i % 5],
            backgroundColor:
              props.type === 'pie'
                ? ['#1db954', '#1ed760', '#159947', '#5fcf8a', '#b3b3b3']
                : `rgba(29, 185, 84, ${props.type === 'bar' ? 0.42 : 0.2})`,
            fill: props.type === 'line',
          })),
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
