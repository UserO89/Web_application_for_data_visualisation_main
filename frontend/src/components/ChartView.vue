<template>
  <VChart class="chart" :option="option" autoresize />
</template>

<script>
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, BarChart, PieChart, ScatterChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
} from 'echarts/components'
import VChart from 'vue-echarts'

use([
  CanvasRenderer,
  LineChart,
  BarChart,
  PieChart,
  ScatterChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
])

export default {
  name: 'ChartView',
  components: {
    VChart,
  },
  props: {
    option: {
      type: Object,
      required: true,
    },
  },
}
</script>

<style scoped>
.chart {
  width: 100%;
  height: 420px;
}
</style>
