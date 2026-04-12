<template>
  <div
    ref="el"
    :class="['tabulator-host', { 'tabulator-host-auto': !fillHeight }]"
  ></div>
</template>

<script>
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { TabulatorFull as Tabulator } from 'tabulator-tables'
import 'tabulator-tables/dist/css/tabulator.min.css'

export default {
  name: 'DataTable',
  props: {
    columns: {
      type: Array,
      required: true,
    },
    rows: {
      type: Array,
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    fillHeight: {
      type: Boolean,
      default: true,
    },
    editable: {
      type: Boolean,
      default: true,
    },
  },
  emits: ['cell-edited', 'cell-editing-state'],
  setup(props, { emit }) {
    const el = ref(null)
    let table = null
    let resizeObserver = null
    let redrawFrameId = null
    let tableReady = false
    let pendingRows = null
    let pendingColumns = null

    const mapColumns = (columns) =>
      columns.map((column) => {
        const { metaType, ...mapped } = column
        const interactiveHandlers = {
          cellClick: (_e, cell) => {
            if (!props.editable) return
            if (cell) cell.edit(true)
          },
          cellEditing: () => {
            if (!props.editable) return
            emit('cell-editing-state', true)
          },
          cellEdited: (cell) => {
            if (!props.editable) return
            emit('cell-edited', {
              row: cell.getRow().getData(),
              field: cell.getField(),
              value: cell.getValue(),
            })
            emit('cell-editing-state', false)
          },
          cellEditCancelled: () => {
            if (!props.editable) return
            emit('cell-editing-state', false)
          },
        }

        if (!props.editable) {
          return {
            ...mapped,
            editor: false,
            editable: false,
            ...interactiveHandlers,
          }
        }
        return {
          ...mapped,
          ...interactiveHandlers,
        }
      })

    const canUseTable = () =>
      Boolean(table && tableReady && el.value && el.value.isConnected)

    const safeRedraw = () => {
      if (!canUseTable()) return
      try {
        table.redraw(true)
      } catch (_) {}
    }

    const scheduleRedraw = () => {
      if (redrawFrameId !== null) return
      redrawFrameId = requestAnimationFrame(() => {
        redrawFrameId = null
        safeRedraw()
      })
    }

    const flushPendingUpdates = () => {
      if (!canUseTable()) return

      if (pendingColumns !== null) {
        try {
          table.setColumns(mapColumns(pendingColumns))
        } catch (_) {}
        pendingColumns = null
      }

      if (pendingRows !== null) {
        try {
          table.replaceData(pendingRows)
        } catch (_) {}
        pendingRows = null
      }

      scheduleRedraw()
    }

    onMounted(() => {
      if (!el.value) return

      const config = {
        data: props.rows,
        columns: mapColumns(props.columns),
        index: 'id',
        layout: 'fitColumns',
        reactiveData: false,
        pagination: true,
        paginationSize: 50,
        paginationSizeSelector: [25, 50, 100, 200],
        movableColumns: true,
        resizableColumns: true,
        tableBuilt: () => {
          tableReady = true
          flushPendingUpdates()
        },
      }
      if (props.fillHeight) {
        config.height = '100%'
      }

      table = new Tabulator(el.value, config)

      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => {
          scheduleRedraw()
        })
        resizeObserver.observe(el.value)
      }
    })

    watch(
      () => props.rows,
      (newRows) => {
        if (!table) return
        if (!tableReady) {
          pendingRows = newRows
          return
        }
        try {
          table.replaceData(newRows)
        } catch (_) {}
        scheduleRedraw()
      },
      { deep: false }
    )

    watch(
      () => props.columns,
      (newColumns) => {
        if (!table) return
        if (!tableReady) {
          pendingColumns = newColumns
          return
        }
        try {
          table.setColumns(mapColumns(newColumns))
        } catch (_) {}
        scheduleRedraw()
      },
      { deep: false }
    )

    watch(
      () => props.active,
      (active) => {
        if (!active) return
        scheduleRedraw()
      }
    )

    watch(
      () => props.editable,
      () => {
        if (!table || !tableReady) return
        try {
          table.setColumns(mapColumns(props.columns))
        } catch (_) {}
        scheduleRedraw()
      }
    )

    onBeforeUnmount(() => {
      tableReady = false
      pendingRows = null
      pendingColumns = null
      if (resizeObserver) {
        resizeObserver.disconnect()
        resizeObserver = null
      }
      if (redrawFrameId !== null) {
        cancelAnimationFrame(redrawFrameId)
        redrawFrameId = null
      }
      if (table) {
        try {
          table.destroy()
        } catch (_) {}
        table = null
      }
    })

    return { el }
  },
}
</script>

<style>
.tabulator-host {
  width: 100%;
  height: 100%;
  min-height: 220px;
  background: #141414;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid var(--border);
}

.tabulator-host-auto {
  height: auto;
}

.tabulator-host-auto .tabulator-tableholder {
  max-height: none !important;
  overflow-y: visible !important;
}

.tabulator-host .tabulator {
  font-size: 14px;
  background: transparent !important;
  color: var(--text) !important;
  border: none !important;
}

.tabulator-host .tabulator-header {
  background: #161616 !important;
  font-weight: 600;
  border-bottom: 1px solid var(--border) !important;
}

.tabulator-host .tabulator-header .tabulator-col {
  background: transparent !important;
  color: var(--muted) !important;
  border-right: 1px solid var(--border) !important;
}

.tabulator-host .tabulator-tableholder,
.tabulator-host .tabulator-table,
.tabulator-host .tabulator-row,
.tabulator-host .tabulator-row.tabulator-row-even,
.tabulator-host .tabulator-row.tabulator-row-odd {
  background: #141414 !important;
}

.tabulator-host .tabulator-cell {
  padding: 0.75rem;
  background: transparent !important;
  color: var(--text) !important;
  border-right: 1px solid var(--border) !important;
  border-bottom: 1px dashed var(--border) !important;
}

.tabulator-host .tabulator-cell.cell-null {
  background: rgba(255, 99, 99, 0.12) !important;
  color: #ffb3b3 !important;
  font-style: italic;
}

.tabulator-host .tabulator-row.tabulator-selected {
  background: rgba(29, 185, 84, 0.2) !important;
}

.tabulator-host .tabulator-footer {
  background: #161616 !important;
  color: var(--muted) !important;
  border-top: 1px solid var(--border) !important;
}

.tabulator-host .tabulator-page {
  color: var(--muted) !important;
}

.tabulator-host .tabulator-page.active {
  color: var(--accent) !important;
}

.tabulator-host .tabulator-row:hover {
  background: rgba(29, 185, 84, 0.12) !important;
}
</style>
