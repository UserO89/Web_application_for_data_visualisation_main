<template>
  <div class="project-page app-content">
    <div v-if="loading" class="loading panel">Loading...</div>
    <div v-else-if="!project" class="error panel">Project not found</div>

    <!-- Import Section -->
    <div v-else-if="!project.dataset">
      <div style="margin-bottom: 12px;">
        <button class="btn" @click="$router.push({ name: 'projects' })">← Back to Projects</button>
      </div>
      <div class="panel">
      <div style="font-weight: 700; margin-bottom: 16px;">Import Data</div>
      <form @submit.prevent="handleImport" class="import-form">
        <div class="form-group">
          <label>CSV File</label>
          <input type="file" @change="handleFileSelect" accept=".csv,.txt" required />
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" v-model="importOptions.has_header" />
            First row is header
          </label>
        </div>
        <div class="form-group">
          <label>Delimiter</label>
          <input v-model="importOptions.delimiter" type="text" maxlength="1" />
        </div>
        <button type="submit" :disabled="!selectedFile || importing" class="btn primary">
          {{ importing ? 'Importing...' : 'Import' }}
        </button>
      </form>
      </div>
    </div>

    <!-- Dataset View: two-column layout -->
    <div v-else>
      <div style="margin-bottom: 12px;">
        <button class="btn" @click="$router.push({ name: 'projects' })">← Back to Projects</button>
      </div>
      <div class="project-grid">
      <!-- Left column: table + controls -->
      <section class="project-left">
        <div class="panel">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <div style="font-weight: 700;">Data Table</div>
            <div style="color: var(--muted); font-size: 13px;">Editable</div>
          </div>

          <div class="controls">
            <button class="btn primary" @click="buildChart">Build Chart</button>
          </div>

          <div class="table-wrap">
            <DataTable
              :columns="tableColumns"
              :rows="tableRows"
              @cell-edited="handleCellEdit"
            />
          </div>
          <div style="margin-top: 12px; color: var(--muted); font-size: 13px;">
            Edit cells, then click "Build Chart".
          </div>
        </div>

        <div class="panel">
          <div style="font-weight: 700; margin-bottom: 8px;">Chart Type</div>
          <div class="controls">
            <button
              v-for="t in chartTypes"
              :key="t.key"
              :class="['btn', { primary: chartType === t.key }]"
              @click="chartType = t.key"
            >
              {{ t.label }}
            </button>
          </div>
        </div>
      </section>

      <!-- Right column: chart + stats -->
      <aside class="project-right">
        <ChartPanel
          :labels="chartLabels"
          :datasets="chartDatasets"
          :type="chartType"
          @clear="chartLabels = []; chartDatasets = []"
        />

        <div class="panel">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <div style="font-weight: 700;">Statistics</div>
            <div style="color: var(--muted); font-size: 13px;">Auto-updated</div>
          </div>

          <div v-if="statisticsLoading" class="loading-small">Loading...</div>
          <div v-else-if="statistics" class="stats">
            <div
              v-for="stat in statistics.slice(0, 6)"
              :key="stat.column"
              class="stat-card"
            >
              <div class="stat-title">{{ stat.column }} ({{ stat.type }})</div>
              <div class="stat-value">{{ formatStat(stat) }}</div>
            </div>
          </div>
        </div>
      </aside>

      <!-- Full-width analysis -->
      <section class="project-analysis">
        <div class="panel analysis">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <div style="font-weight: 700;">Data Analysis</div>
            <div style="color: var(--muted); font-size: 13px;">Recommendations</div>
          </div>
          <div class="desc" id="analysisText">
            <div v-if="suggestionsLoading">Loading...</div>
            <div v-else-if="suggestions.length > 0">
              <div
                v-for="(s, i) in suggestions"
                :key="i"
                style="margin-bottom: 8px; padding: 8px; background: var(--glass); border-radius: 8px;"
              >
                <strong>{{ s.title }}</strong> — {{ s.description }}
              </div>
            </div>
            <div v-else>
              Analysis will appear here: trends, outliers and recommendations after building the chart.
            </div>
          </div>
        </div>
      </section>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { projectsApi } from '../api/projects'
import DataTable from '../components/DataTable.vue'
import ChartPanel from '../components/ChartPanel.vue'

export default {
  name: 'ProjectPage',
  components: { DataTable, ChartPanel },
  setup() {
    const route = useRoute()
    const project = ref(null)
    const loading = ref(true)
    const selectedFile = ref(null)
    const importing = ref(false)
    const importOptions = ref({ has_header: true, delimiter: ',' })
    const tableRows = ref([])
    const statistics = ref(null)
    const statisticsLoading = ref(false)
    const suggestions = ref([])
    const suggestionsLoading = ref(false)
    const chartType = ref('line')
    const chartLabels = ref([])
    const chartDatasets = ref([])

    const chartTypes = [
      { key: 'line', label: 'Line' },
      { key: 'bar', label: 'Bar' },
      { key: 'pie', label: 'Pie' },
    ]

    const tableColumns = computed(() => {
      if (!project.value?.dataset?.columns) return []
      return project.value.dataset.columns.map(col => ({
        title: col.name,
        field: col.position,
        editor: 'input',
      }))
    })

    const loadProject = async () => {
      loading.value = true
      try {
        const response = await projectsApi.get(route.params.id)
        project.value = response.project
        if (project.value.dataset) await loadRows()
      } catch (e) {
        console.error(e)
      } finally {
        loading.value = false
      }
    }

    const loadRows = async () => {
      try {
        const response = await projectsApi.getRows(route.params.id)
        const data = response.data ?? response
        const rows = Array.isArray(data) ? data : (data.data || [])
        tableRows.value = rows.map(row => {
          const values = typeof row.values === 'string' ? JSON.parse(row.values) : row.values || {}
          return { id: row.id, ...values }
        })
      } catch (e) {
        console.error(e)
      }
    }

    const handleFileSelect = (e) => { selectedFile.value = e.target.files[0] }

    const handleImport = async () => {
      if (!selectedFile.value) return
      importing.value = true
      try {
        await projectsApi.importDataset(route.params.id, selectedFile.value, importOptions.value)
        await loadProject()
      } catch (e) {
        alert('Import error: ' + (e.response?.data?.message || e.message))
      } finally {
        importing.value = false
      }
    }

    const handleCellEdit = async (data) => {
      try {
        const values = tableColumns.value.map(col => data.row[col.field] ?? '')
        await projectsApi.updateRow(route.params.id, data.row.id, values)
      } catch (e) {
        console.error(e)
      }
    }

    const loadStatistics = async () => {
      statisticsLoading.value = true
      try {
        const r = await projectsApi.getStatistics(route.params.id)
        statistics.value = r.statistics || []
      } catch (e) {
        console.error(e)
      } finally {
        statisticsLoading.value = false
      }
    }

    const loadSuggestions = async () => {
      suggestionsLoading.value = true
      try {
        const r = await projectsApi.getSuggestions(route.params.id)
        suggestions.value = r.suggestions || []
      } catch (e) {
        console.error(e)
      } finally {
        suggestionsLoading.value = false
      }
    }

    const numeric = (v) => {
      const n = parseFloat(String(v).replace(',', '.'))
      return Number.isFinite(n) ? n : NaN
    }

    const buildChart = () => {
      if (!tableRows.value.length || !tableColumns.value.length) return

      const cols = tableColumns.value
      const rows = tableRows.value
      const labelCol = cols[0]
      const labelIdx = labelCol?.field ?? 0

      const labels = rows.map(r => String(r[labelIdx] ?? ''))
      const datasets = []

      cols.slice(1).forEach((col, i) => {
        const vals = rows.map(r => numeric(r[col.field]))
        if (vals.some(v => !Number.isNaN(v))) {
          datasets.push({
            label: col.title,
            data: vals.map(v => Number.isNaN(v) ? 0 : v),
          })
        }
      })

      chartLabels.value = labels
      chartDatasets.value = datasets.length ? datasets : [{ label: 'Values', data: rows.map(r => numeric(r[labelIdx]) || 0) }]
    }

    const formatStat = (stat) => {
      const s = stat.statistics
      if (!s) return '—'
      if (s.mean !== undefined) return `μ ${Number(s.mean).toFixed(2)}`
      if (s.min !== undefined && s.max !== undefined) return `${s.min} … ${s.max}`
      if (s.count !== undefined) return `n = ${s.count}`
      if (s.earliest && s.latest) return `${s.earliest} … ${s.latest}`
      return JSON.stringify(s).slice(0, 40)
    }

    onMounted(loadProject)

    watch(
      () => project.value?.dataset,
      (ds) => {
        if (ds) {
          loadStatistics()
          loadSuggestions()
        }
      },
      { immediate: true }
    )

    return {
      project,
      loading,
      selectedFile,
      importing,
      importOptions,
      tableColumns,
      tableRows,
      statistics,
      statisticsLoading,
      suggestions,
      suggestionsLoading,
      chartType,
      chartTypes,
      chartLabels,
      chartDatasets,
      handleFileSelect,
      handleImport,
      handleCellEdit,
      buildChart,
      formatStat,
    }
  },
}
</script>

<style scoped>
.project-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.app-content {
  flex: 1;
}

.loading {
  text-align: center;
  padding: 3rem;
  color: var(--muted);
}

.error {
  text-align: center;
  padding: 2rem;
  color: #fca5a5;
}

.project-grid {
  display: grid;
  grid-template-columns: 1fr 420px;
  gap: 18px;
  grid-auto-rows: min-content;
}

.project-left {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.project-right {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.project-analysis {
  grid-column: 1 / -1;
}

.loading-small {
  text-align: center;
  padding: 1rem;
  color: var(--muted);
  font-size: 13px;
}

@media (max-width: 980px) {
  .project-grid {
    grid-template-columns: 1fr;
  }

  .project-right :deep(.chart-panel) {
    height: 300px;
  }
}
</style>
