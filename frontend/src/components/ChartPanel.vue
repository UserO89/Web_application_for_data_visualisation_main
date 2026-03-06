<template>
  <div :class="['chart-panel', { panel: !embedded, embedded }]">
    <div
      v-if="!embedded"
      style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;"
    >
      <div style="font-weight: 700;">Visualization</div>
      <div style="color: var(--muted); font-size: 13px;">Interactive area</div>
    </div>

    <div class="chart-canvas">
      <BaseEChart ref="chartRef" :option="chartOption" />
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
import { computed, ref } from 'vue'
import BaseEChart from './charts/BaseEChart.vue'
import { buildEChartOption } from '../charts/chartTransformers/chartDefinitionToEChartsOption'

export default {
  name: 'ChartPanel',
  components: { BaseEChart },
  props: {
    labels: { type: Array, default: () => [] },
    datasets: { type: Array, default: () => [] },
    meta: { type: Object, default: () => ({}) },
    type: { type: String, default: 'line' },
    embedded: { type: Boolean, default: false },
  },
  emits: ['clear'],
  setup(props) {
    const chartRef = ref(null)

    const chartDefinition = computed(() => ({
      type: props.type || 'line',
      labels: Array.isArray(props.labels) ? props.labels : [],
      datasets: Array.isArray(props.datasets) ? props.datasets : [],
      meta: props.meta && typeof props.meta === 'object' ? props.meta : {},
    }))

    const hasRenderableData = computed(() => {
      const definition = chartDefinition.value
      const datasets = definition.datasets
      if (!datasets.length) return false

      if (definition.type === 'scatter') {
        return datasets.some((dataset) => Array.isArray(dataset?.data) && dataset.data.length > 0)
      }

      if (definition.type === 'boxplot') {
        return datasets.some((dataset) => {
          if (Array.isArray(dataset?.values)) return dataset.values.length > 0
          return Array.isArray(dataset?.data) && dataset.data.length > 0
        })
      }

      if (definition.type === 'pie') {
        return definition.labels.length > 0 && datasets.some((dataset) => Array.isArray(dataset?.data) && dataset.data.length > 0)
      }

      return definition.labels.length > 0 && datasets.some((dataset) => Array.isArray(dataset?.data) && dataset.data.length > 0)
    })

    const chartOption = computed(() => {
      if (!hasRenderableData.value) return {}
      return buildEChartOption(chartDefinition.value)
    })

    const exportPNG = () => {
      chartRef.value?.exportPng?.('chart.png')
    }

    return { chartRef, chartOption, exportPNG }
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
}

.chart-footer {
  display: flex;
  gap: 8px;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
}
</style>
