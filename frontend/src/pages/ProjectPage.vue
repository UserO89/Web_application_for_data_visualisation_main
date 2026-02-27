<template>
  <div class="project-page app-content">
    <div v-if="loading" class="loading panel">Loading...</div>
    <div v-else-if="!project" class="error panel">Project not found</div>

    <div v-else-if="!project.dataset">
      <div class="top-row">
        <button class="btn" @click="$router.push({ name: 'projects' })"><- Back to Projects</button>
      </div>
      <div class="panel">
        <div class="section-title">Add Data</div>
        <div class="mode-row">
          <button type="button" :class="['btn', { primary: importMode === 'file' }]" @click="importMode = 'file'">Upload File</button>
          <button type="button" :class="['btn', { primary: importMode === 'manual' }]" @click="importMode = 'manual'">Manual Input</button>
        </div>

        <form v-if="importMode === 'file'" @submit.prevent="handleImport">
          <div class="form-group"><label>CSV File</label><input type="file" @change="handleFileSelect" accept=".csv,.txt" required /></div>
          <div class="form-group"><label><input type="checkbox" v-model="importOptions.has_header" /> First row is header</label></div>
          <div class="form-group"><label>Delimiter</label><input v-model="importOptions.delimiter" type="text" maxlength="1" /></div>
          <button type="submit" :disabled="!selectedFile || importing" class="btn primary">{{ importing ? 'Importing...' : 'Import' }}</button>
        </form>

        <div v-else class="manual-builder">
          <div class="mode-row">
            <button class="btn" type="button" @click="addManualColumn">+ Column</button>
            <button class="btn" type="button" @click="removeManualColumn" :disabled="manualHeaders.length <= 1">- Column</button>
            <button class="btn" type="button" @click="addManualRow">+ Row</button>
            <button class="btn" type="button" @click="removeManualRow" :disabled="manualRowsInput.length <= 1">- Row</button>
          </div>
          <div class="table-wrap manual-table-wrap">
            <table class="data-table manual-table">
              <thead><tr><th v-for="(h, i) in manualHeaders" :key="`h-${i}`"><input v-model="manualHeaders[i]" class="manual-input header" :placeholder="`Column ${i + 1}`" /></th></tr></thead>
              <tbody>
                <tr v-for="(row, r) in manualRowsInput" :key="`r-${r}`">
                  <td v-for="(_, c) in manualHeaders" :key="`c-${r}-${c}`"><input v-model="manualRowsInput[r][c]" class="manual-input" /></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-if="manualError" class="manual-error">{{ manualError }}</div>
          <button type="button" :disabled="importing" class="btn primary" @click="handleManualImport">{{ importing ? 'Creating...' : 'Create Table' }}</button>
        </div>
      </div>
    </div>

    <div v-else>
      <div class="top-row">
        <button class="btn" @click="$router.push({ name: 'projects' })"><- Back to Projects</button>
      </div>

      <div class="panel layout-bar">
        <div class="section-title">Workspace</div>
        <div class="layout-controls">
          <button type="button" class="btn" @click="applyPreset('default')">Default</button>
          <button
            v-for="p in presetOptions"
            :key="p.key"
            type="button"
            :class="['btn', { primary: activePreset === p.key }]"
            @click="applyPreset(p.key)"
          >
            {{ p.label }}
          </button>
        </div>
      </div>

      <div ref="workspaceRef" class="workspace-canvas" :style="{ height: `${workspaceHeight}px` }">
        <section
          v-for="panelId in panelIds"
          :key="panelId"
          class="workspace-panel panel"
          :style="panelStyle(panelId)"
          @mousedown="bringToFront(panelId)"
        >
          <header class="drag-handle" @mousedown.left.prevent="startDrag(panelId, $event)">
            <div class="title">{{ panelConfig[panelId].title }}</div>
            <div class="sub">{{ panelConfig[panelId].subtitle }}</div>
          </header>

          <div :class="['panel-content', `${panelId}-content`]">
            <template v-if="panelId === 'table'">
              <div class="table-wrap table-fill">
                <DataTable :columns="tableColumns" :rows="tableRows" @cell-edited="handleCellEdit" />
              </div>
            </template>

            <template v-else-if="panelId === 'chart'">
              <ChartPanel embedded :labels="chartLabels" :datasets="chartDatasets" :type="chartType" @clear="clearChart" />
            </template>

            <template v-else-if="panelId === 'stats'">
              <div v-if="statisticsLoading" class="muted">Loading...</div>
              <div v-else-if="statistics.length" class="stats-grid">
                <div v-for="s in statistics.slice(0, 8)" :key="s.column" class="stat-card">
                  <div class="stat-title">{{ s.column }} ({{ s.type }})</div>
                  <div class="stat-value">{{ formatStat(s) }}</div>
                </div>
              </div>
              <div v-else class="muted">No statistics available.</div>
            </template>

            <template v-else>
              <div class="controls">
                <button class="btn primary" type="button" @click="buildChart">Build Chart</button>
                <button class="btn" type="button" @click="refreshData">Refresh Data</button>
                <button class="btn" type="button" @click="exportTableCsv">Export CSV</button>
              </div>
              <div class="controls">
                <button v-for="t in chartTypes" :key="t.key" :class="['btn', { primary: chartType === t.key }]" @click="chartType = t.key" type="button">{{ t.label }}</button>
              </div>
              <div class="analysis-box">
                <div class="analysis-title">Data Analysis</div>
                <div v-if="suggestionsLoading" class="analysis-item">Loading...</div>
                <template v-else-if="suggestions.length">
                  <div v-for="(s, i) in suggestions.slice(0, 6)" :key="i" class="analysis-item"><strong>{{ s.title }}</strong> - {{ s.description }}</div>
                </template>
                <div v-else class="analysis-item">Recommendations will appear here.</div>
              </div>
            </template>
          </div>

          <div v-for="d in resizeDirs" :key="`${panelId}-${d}`" :class="['resize-handle', `h-${d}`]" @mousedown.left.stop.prevent="startResize(panelId, d, $event)"></div>
        </section>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import ChartPanel from '../components/ChartPanel.vue'
import DataTable from '../components/DataTable.vue'
import { projectsApi } from '../api/projects'

const IDS = ['table', 'chart', 'stats', 'functions']
const STORAGE_PREFIX = 'dataviz.workspace.layout.v1.'
const PRESETS = [
  { key: 'wide-stack', label: 'Table+Chart Full Width' },
  { key: 'analysis-focus', label: 'Analysis Focus' },
  { key: 'quad', label: '4-Grid' },
]
const MIN = { table: { w: 420, h: 280 }, chart: { w: 340, h: 280 }, stats: { w: 300, h: 220 }, functions: { w: 320, h: 240 } }
const createManualRow = (n) => Array.from({ length: n }, () => '')

export default {
  name: 'ProjectPage',
  components: { DataTable, ChartPanel },
  setup() {
    const route = useRoute()
    const workspaceRef = ref(null)

    const project = ref(null)
    const loading = ref(true)
    const selectedFile = ref(null)
    const importing = ref(false)
    const importOptions = ref({ has_header: true, delimiter: ',' })
    const importMode = ref('file')
    const manualHeaders = ref(['Column 1', 'Column 2', 'Column 3'])
    const manualRowsInput = ref([createManualRow(3), createManualRow(3), createManualRow(3), createManualRow(3)])
    const manualError = ref('')

    const tableRows = ref([])
    const statistics = ref([])
    const statisticsLoading = ref(false)
    const suggestions = ref([])
    const suggestionsLoading = ref(false)
    const chartType = ref('line')
    const chartLabels = ref([])
    const chartDatasets = ref([])

    const panelLayouts = ref({})
    const zCounter = ref(1)
    const interaction = ref(null)
    const initializedForProjectId = ref(null)
    const activePreset = ref('default')

    const panelIds = IDS
    const resizeDirs = ['n', 'e', 's', 'w']
    const presetOptions = PRESETS
    const panelConfig = {
      table: { title: 'Data Table', subtitle: 'Editable' },
      chart: { title: 'Visualization', subtitle: 'Interactive area' },
      stats: { title: 'Statistics', subtitle: 'Auto-updated' },
      functions: { title: 'Functions', subtitle: 'Controls and analysis' },
    }
    const chartTypes = [{ key: 'line', label: 'Line' }, { key: 'bar', label: 'Bar' }, { key: 'pie', label: 'Pie' }]

    const cellField = (position) => `col_${position}`
    const sortedDatasetColumns = computed(() =>
      [...(project.value?.dataset?.columns || [])].sort((a, b) => Number(a.position) - Number(b.position))
    )
    const tableColumns = computed(() =>
      sortedDatasetColumns.value.map((c) => ({ title: c.name, field: cellField(c.position), editor: 'input' }))
    )
    const workspaceHeight = computed(() => {
      if (!panelIds.every((id) => panelLayouts.value[id])) return 760
      return Math.max(760, Math.max(...panelIds.map((id) => panelLayouts.value[id].y + panelLayouts.value[id].h)) + 16)
    })

    const panelStyle = (id) => {
      const p = panelLayouts.value[id]
      return p ? { left: `${p.x}px`, top: `${p.y}px`, width: `${p.w}px`, height: `${p.h}px`, zIndex: p.z } : {}
    }

    const canvasW = () => Math.max(320, workspaceRef.value?.clientWidth || 1120)
    const key = () => `${STORAGE_PREFIX}${route.params.id}`

    const escCsv = (v) => {
      const s = String(v ?? '')
      return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
    }

    const normalizeHeaders = () => {
      const used = new Map()
      return manualHeaders.value.map((h, i) => {
        const base = (h || '').trim() || `Column ${i + 1}`
        const n = used.get(base) || 0
        used.set(base, n + 1)
        return n === 0 ? base : `${base} (${n + 1})`
      })
    }

    const buildPreset = (preset) => {
      const w = canvasW()
      const g = 16
      const single = () => {
        let y = 0
        const h = { table: 420, chart: 360, stats: 260, functions: 300 }
        const out = {}
        IDS.forEach((id, i) => { out[id] = { x: 0, y, w, h: h[id], z: i + 1 }; y += h[id] + g })
        return out
      }
      if (w < 980) return single()

      if (preset === 'wide-stack') {
        const half = Math.floor((w - g) / 2)
        return {
          table: { x: 0, y: 0, w, h: 400, z: 1 },
          chart: { x: 0, y: 416, w, h: 320, z: 2 },
          stats: { x: 0, y: 752, w: half, h: 260, z: 3 },
          functions: { x: half + g, y: 752, w: w - half - g, h: 260, z: 4 },
        }
      }
      if (preset === 'analysis-focus') {
        const right = Math.floor(w * 0.36)
        const left = w - right - g
        return {
          chart: { x: 0, y: 0, w: left, h: 420, z: 1 },
          table: { x: 0, y: 436, w: left, h: 360, z: 2 },
          stats: { x: left + g, y: 0, w: right, h: 280, z: 3 },
          functions: { x: left + g, y: 296, w: right, h: 500, z: 4 },
        }
      }
      if (preset === 'quad') {
        const half = Math.floor((w - g) / 2)
        return {
          table: { x: 0, y: 0, w: half, h: 360, z: 1 },
          chart: { x: half + g, y: 0, w: w - half - g, h: 360, z: 2 },
          stats: { x: 0, y: 376, w: half, h: 300, z: 3 },
          functions: { x: half + g, y: 376, w: w - half - g, h: 300, z: 4 },
        }
      }
      const left = Math.floor(w * 0.64) - g
      const right = w - left - g
      return {
        table: { x: 0, y: 0, w: left, h: 440, z: 1 },
        chart: { x: left + g, y: 0, w: right, h: 360, z: 2 },
        stats: { x: left + g, y: 376, w: right, h: 250, z: 3 },
        functions: { x: 0, y: 456, w: left, h: 280, z: 4 },
      }
    }

    const rectsOverlap = (a, b) =>
      a.x < b.x + b.w &&
      a.x + a.w > b.x &&
      a.y < b.y + b.h &&
      a.y + a.h > b.y

    const hasAnyOverlap = (layouts) => {
      for (let i = 0; i < IDS.length; i += 1) {
        for (let j = i + 1; j < IDS.length; j += 1) {
          const a = layouts[IDS[i]]
          const b = layouts[IDS[j]]
          if (a && b && rectsOverlap(a, b)) return true
        }
      }
      return false
    }

    const sanitize = (layouts, savedW) => {
      if (!layouts || typeof layouts !== 'object') return null
      const cw = canvasW()
      const ratio = savedW > 0 ? cw / savedW : 1
      const out = {}
      for (const [i, id] of IDS.entries()) {
        const p = layouts[id]
        if (!p) return null
        let x = Number(p.x) * ratio
        let y = Number(p.y)
        let w = Number(p.w) * ratio
        let h = Number(p.h)
        let z = Number(p.z)
        if ([x, y, w, h].some((v) => !Number.isFinite(v))) return null
        w = Math.max(MIN[id].w, w)
        h = Math.max(MIN[id].h, h)
        if (w > cw) { w = cw; x = 0 }
        x = Math.max(0, x); y = Math.max(0, y)
        if (x + w > cw) x = Math.max(0, cw - w)
        out[id] = { x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h), z: Number.isFinite(z) ? z : i + 1 }
      }
      if (hasAnyOverlap(out)) return null
      return out
    }

    const setLayouts = (l, persist = true) => {
      panelLayouts.value = l
      zCounter.value = Math.max(...IDS.map((id) => panelLayouts.value[id].z)) + 1
      if (persist) saveLayouts()
    }

    const saveLayouts = () => {
      if (!project.value?.dataset || !IDS.every((id) => panelLayouts.value[id])) return
      try {
        localStorage.setItem(key(), JSON.stringify({ width: canvasW(), preset: activePreset.value, layouts: panelLayouts.value }))
      } catch (_) {}
    }

    const loadLayouts = () => {
      try {
        const raw = localStorage.getItem(key())
        if (!raw) return false
        const payload = JSON.parse(raw)
        const layouts = sanitize(payload.layouts, Number(payload.width))
        if (!layouts) return false
        activePreset.value = payload.preset || 'default'
        setLayouts(layouts, false)
        return true
      } catch (_) {
        return false
      }
    }

    const applyPreset = (preset) => {
      activePreset.value = preset
      setLayouts(buildPreset(preset), true)
    }

    const bringToFront = (id) => {
      if (!panelLayouts.value[id]) return
      panelLayouts.value[id].z = zCounter.value++
    }

    const clampRect = (id, rect) => {
      const cw = canvasW()
      const min = MIN[id]
      const out = { x: rect.x, y: rect.y, w: rect.w, h: rect.h }
      out.w = Math.max(min.w, out.w)
      out.h = Math.max(min.h, out.h)
      if (out.w > cw) {
        out.w = cw
        out.x = 0
      }
      if (out.x < 0) out.x = 0
      if (out.x + out.w > cw) out.x = Math.max(0, cw - out.w)
      if (out.y < 0) out.y = 0
      return out
    }

    const collides = (id, rect) =>
      IDS.some((otherId) => {
        if (otherId === id) return false
        const other = panelLayouts.value[otherId]
        return other ? rectsOverlap(rect, other) : false
      })

    const applyCandidate = (id, candidate) => {
      const next = clampRect(id, candidate)
      if (collides(id, next)) return false
      Object.assign(panelLayouts.value[id], next)
      return true
    }

    const startDrag = (id, e) => {
      const p = panelLayouts.value[id]
      if (!p) return
      bringToFront(id)
      interaction.value = { type: 'drag', id, sx: e.clientX, sy: e.clientY, base: { ...p } }
      document.body.style.userSelect = 'none'
    }

    const startResize = (id, dir, e) => {
      const p = panelLayouts.value[id]
      if (!p) return
      bringToFront(id)
      interaction.value = { type: 'resize', id, dir, sx: e.clientX, sy: e.clientY, base: { ...p } }
      document.body.style.userSelect = 'none'
    }

    const onMove = (e) => {
      const it = interaction.value
      if (!it) return
      const p = panelLayouts.value[it.id]
      if (!p) return
      const dx = e.clientX - it.sx
      const dy = e.clientY - it.sy
      if (it.type === 'drag') {
        const b = it.base
        const cw = canvasW()
        applyCandidate(it.id, {
          x: Math.max(0, Math.min(b.x + dx, Math.max(0, cw - b.w))),
          y: Math.max(0, b.y + dy),
          w: b.w,
          h: b.h,
        })
        return
      }
      const d = it.dir
      const b = it.base
      const min = MIN[it.id]
      const right = b.x + b.w
      const bottom = b.y + b.h
      let x = b.x, y = b.y, w = b.w, h = b.h
      if (d.includes('e')) w = Math.max(min.w, b.w + dx)
      if (d.includes('s')) h = Math.max(min.h, b.h + dy)
      if (d.includes('w')) { x = Math.min(Math.max(0, b.x + dx), right - min.w); w = right - x }
      if (d.includes('n')) { y = Math.min(Math.max(0, b.y + dy), bottom - min.h); h = bottom - y }
      applyCandidate(it.id, { x, y, w, h })
    }

    const onUp = () => {
      if (interaction.value) {
        interaction.value = null
        activePreset.value = 'custom'
        saveLayouts()
      }
      document.body.style.userSelect = ''
    }

    const onResizeWindow = () => {
      const next = {}
      IDS.forEach((id) => {
        if (!panelLayouts.value[id]) return
        next[id] = { ...panelLayouts.value[id], ...clampRect(id, panelLayouts.value[id]) }
      })
      if (!IDS.every((id) => next[id])) return
      if (hasAnyOverlap(next)) {
        const fallbackPreset = activePreset.value === 'custom' ? 'default' : activePreset.value
        activePreset.value = fallbackPreset
        setLayouts(buildPreset(fallbackPreset), true)
        return
      }
      IDS.forEach((id) => Object.assign(panelLayouts.value[id], next[id]))
      saveLayouts()
    }

    const loadProject = async () => {
      loading.value = true
      try {
        const r = await projectsApi.get(route.params.id)
        project.value = r.project
        if (project.value?.dataset) {
          await Promise.all([loadRows(), loadStats(), loadSuggestions()])
          if (initializedForProjectId.value !== String(route.params.id)) {
            await nextTick()
            if (!loadLayouts()) applyPreset('default')
            initializedForProjectId.value = String(route.params.id)
          }
        } else {
          tableRows.value = []; statistics.value = []; suggestions.value = []; chartLabels.value = []; chartDatasets.value = []
        }
      } catch (e) {
        console.error(e)
      } finally {
        loading.value = false
      }
    }

    const loadRows = async () => {
      try {
        const r = await projectsApi.getRows(route.params.id)
        const data = r.data ?? r
        const rows = Array.isArray(data) ? data : (data.data || [])
        tableRows.value = rows.map((row) => {
          const values = typeof row.values === 'string' ? JSON.parse(row.values) : (row.values || {})
          const mapped = { id: row.id }
          sortedDatasetColumns.value.forEach((col) => {
            const position = Number(col.position)
            let value = ''
            if (Array.isArray(values)) {
              value = values[position] ?? ''
            } else if (values && typeof values === 'object') {
              value = values[position] ?? values[String(position)] ?? values[col.name] ?? ''
            }
            mapped[cellField(position)] = value
          })
          return mapped
        })
      } catch (e) { console.error(e) }
    }

    const loadStats = async () => {
      statisticsLoading.value = true
      try {
        const r = await projectsApi.getStatistics(route.params.id)
        statistics.value = r.statistics || []
      } catch (e) { console.error(e) } finally { statisticsLoading.value = false }
    }

    const loadSuggestions = async () => {
      suggestionsLoading.value = true
      try {
        const r = await projectsApi.getSuggestions(route.params.id)
        suggestions.value = r.suggestions || []
      } catch (e) { console.error(e) } finally { suggestionsLoading.value = false }
    }

    const refreshData = async () => Promise.all([loadRows(), loadStats(), loadSuggestions()])

    const handleFileSelect = (e) => { selectedFile.value = e.target.files?.[0] || null }
    const handleImport = async () => {
      if (!selectedFile.value) return
      importing.value = true; manualError.value = ''
      try { await projectsApi.importDataset(route.params.id, selectedFile.value, importOptions.value); await loadProject() }
      catch (e) { window.alert('Import error: ' + (e.response?.data?.message || e.message)) }
      finally { importing.value = false }
    }

    const addManualColumn = () => { manualHeaders.value.push(`Column ${manualHeaders.value.length + 1}`); manualRowsInput.value = manualRowsInput.value.map((r) => [...r, '']) }
    const removeManualColumn = () => { if (manualHeaders.value.length <= 1) return; manualHeaders.value.pop(); manualRowsInput.value = manualRowsInput.value.map((r) => r.slice(0, manualHeaders.value.length)) }
    const addManualRow = () => manualRowsInput.value.push(createManualRow(manualHeaders.value.length))
    const removeManualRow = () => { if (manualRowsInput.value.length > 1) manualRowsInput.value.pop() }

    const handleManualImport = async () => {
      manualError.value = ''
      if (!manualHeaders.value.length) { manualError.value = 'Add at least one column.'; return }
      if (!manualRowsInput.value.length) { manualError.value = 'Add at least one row.'; return }
      const hasData = manualRowsInput.value.some((r) => r.some((c) => String(c || '').trim() !== ''))
      if (!hasData) { manualError.value = 'Fill at least one cell before creating the table.'; return }

      importing.value = true
      try {
        const headers = normalizeHeaders()
        const lines = [headers.map(escCsv).join(',')]
        manualRowsInput.value.forEach((row) => lines.push(headers.map((_, i) => row[i] ?? '').map(escCsv).join(',')))
        const file = new File([lines.join('\n')], 'manual_dataset.csv', { type: 'text/csv' })
        await projectsApi.importDataset(route.params.id, file, { has_header: true, delimiter: ',' })
        await loadProject()
      } catch (e) {
        manualError.value = e?.response?.data?.message || 'Failed to create table from manual data.'
      } finally {
        importing.value = false
      }
    }

    const handleCellEdit = async (data) => {
      try {
        const values = sortedDatasetColumns.value.map((col) => data.row[cellField(col.position)] ?? '')
        await projectsApi.updateRow(route.params.id, data.row.id, values)
      } catch (e) { console.error(e) }
    }

    const numeric = (v) => { const n = parseFloat(String(v).replace(',', '.')); return Number.isFinite(n) ? n : NaN }
    const buildChart = () => {
      if (!tableRows.value.length || !tableColumns.value.length) return
      const cols = tableColumns.value
      const rows = tableRows.value
      const li = cols[0]?.field ?? 0
      const labels = rows.map((r) => String(r[li] ?? ''))
      const datasets = []
      cols.slice(1).forEach((c) => {
        const vals = rows.map((r) => numeric(r[c.field]))
        if (vals.some((v) => !Number.isNaN(v))) datasets.push({ label: c.title, data: vals.map((v) => Number.isNaN(v) ? 0 : v) })
      })
      chartLabels.value = labels
      chartDatasets.value = datasets.length ? datasets : [{ label: 'Values', data: rows.map((r) => numeric(r[li]) || 0) }]
    }

    const clearChart = () => { chartLabels.value = []; chartDatasets.value = [] }
    const exportTableCsv = () => {
      if (!tableColumns.value.length || !tableRows.value.length) { window.alert('No table data to export.'); return }
      const headers = tableColumns.value.map((c) => c.title)
      const lines = [headers.map(escCsv).join(',')]
      tableRows.value.forEach((row) => lines.push(tableColumns.value.map((c) => row[c.field] ?? '').map(escCsv).join(',')))
      const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${project.value?.title || 'project'}-table.csv`
      a.click()
      URL.revokeObjectURL(url)
    }

    const formatStat = (s) => {
      const st = s.statistics
      if (!st) return '-'
      if (st.mean !== undefined) return `mean ${Number(st.mean).toFixed(2)}`
      if (st.min !== undefined && st.max !== undefined) return `${st.min} .. ${st.max}`
      if (st.count !== undefined) return `n = ${st.count}`
      if (st.earliest && st.latest) return `${st.earliest} .. ${st.latest}`
      return JSON.stringify(st).slice(0, 40)
    }

    onMounted(() => {
      loadProject()
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
      window.addEventListener('resize', onResizeWindow)
    })

    onBeforeUnmount(() => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('resize', onResizeWindow)
      document.body.style.userSelect = ''
      saveLayouts()
    })

    watch(() => route.params.id, () => { initializedForProjectId.value = null; loadProject() })

    return {
      project, loading, selectedFile, importing, importOptions, importMode, manualHeaders, manualRowsInput, manualError,
      tableRows, tableColumns, statistics, statisticsLoading, suggestions, suggestionsLoading, chartType, chartTypes,
      chartLabels, chartDatasets, workspaceRef, workspaceHeight, panelIds, panelConfig, resizeDirs, panelStyle,
      activePreset, presetOptions, applyPreset, bringToFront, startDrag, startResize, handleFileSelect, handleImport,
      addManualColumn, removeManualColumn, addManualRow, removeManualRow, handleManualImport, handleCellEdit,
      buildChart, clearChart, refreshData, exportTableCsv, formatStat,
    }
  },
}
</script>

<style scoped>
.project-page { display: flex; flex-direction: column; gap: 18px; }
.app-content { flex: 1; }
.top-row { margin-bottom: 12px; }
.loading { text-align: center; padding: 3rem; color: var(--muted); }
.error { text-align: center; padding: 2rem; color: #fca5a5; }
.section-title { font-weight: 700; margin-bottom: 12px; }
.mode-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
.manual-builder { display: flex; flex-direction: column; gap: 10px; }
.manual-table-wrap { max-height: 360px; }
.manual-table { min-width: 600px; }
.manual-input { width: 100%; min-width: 120px; padding: 7px 8px; border: 1px solid var(--border); border-radius: 8px; background: var(--surface); color: var(--text); font-size: 13px; }
.manual-input:focus { outline: none; border-color: var(--accent); }
.manual-input.header { font-weight: 600; }
.manual-error { color: #ff9b9b; font-size: 13px; }

.layout-bar { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
.layout-controls { display: flex; gap: 8px; flex-wrap: wrap; }

.presets-panel { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
.presets-title { color: var(--muted); font-size: 13px; font-weight: 700; }
.presets-row { display: flex; gap: 8px; flex-wrap: wrap; }

.workspace-canvas { position: relative; width: 100%; min-height: 760px; }
.workspace-panel { position: absolute; overflow: hidden; box-sizing: border-box; padding: 12px; }
.drag-handle { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid var(--border); cursor: move; user-select: none; }
.drag-handle .title { font-weight: 700; }
.drag-handle .sub { font-size: 12px; color: var(--muted); }

.panel-content { height: calc(100% - 44px); overflow: hidden; }
.table-content, .stats-content, .functions-content { overflow: auto; }
.chart-content { overflow: hidden; }
.table-fill { height: 100%; }

.stats-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.stat-card { background: #1a1a1a; border: 1px solid var(--border); border-radius: 10px; padding: 10px; }
.stat-title { color: var(--muted); font-size: 12px; margin-bottom: 6px; }
.stat-value { font-size: 16px; font-weight: 700; }
.muted { color: var(--muted); font-size: 13px; }

.controls { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }
.analysis-box { border: 1px solid var(--border); border-radius: 10px; background: #1a1a1a; padding: 10px; }
.analysis-title { font-size: 13px; font-weight: 700; margin-bottom: 8px; }
.analysis-item { font-size: 12px; color: var(--muted); line-height: 1.5; margin-bottom: 6px; }
.analysis-item:last-child { margin-bottom: 0; }

.resize-handle { position: absolute; z-index: 5; }
.h-n { top: -4px; left: 12px; right: 12px; height: 8px; cursor: n-resize; }
.h-s { bottom: -4px; left: 12px; right: 12px; height: 8px; cursor: s-resize; }
.h-e { top: 12px; bottom: 12px; right: -4px; width: 8px; cursor: e-resize; }
.h-w { top: 12px; bottom: 12px; left: -4px; width: 8px; cursor: w-resize; }

@media (max-width: 980px) {
  .workspace-canvas { min-height: 980px; }
  .stats-grid { grid-template-columns: 1fr; }
}

@media (max-width: 720px) {
  .manual-table { min-width: 520px; }
}
</style>
