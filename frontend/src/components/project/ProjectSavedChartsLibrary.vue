<template>
  <div class="library-shell">
    <div class="library-head">
      <div class="analysis-title">{{ t('project.workspace.library.title') }}</div>
      <button class="btn" type="button" @click="$emit('refresh-saved-charts')">{{ t('project.workspace.library.refresh') }}</button>
    </div>

    <div v-if="savedChartsLoading" class="library-empty">{{ t('project.workspace.library.loading') }}</div>
    <div v-else-if="savedChartsError" class="library-empty">{{ savedChartsError }}</div>
    <div v-else-if="!savedCharts.length" class="library-empty">
      {{ t('project.workspace.library.empty') }}
    </div>

    <div v-else class="saved-charts-grid">
      <article
        v-for="savedChart in savedCharts"
        :key="`saved-chart-${savedChart.id}`"
        class="saved-chart-card"
      >
        <div class="saved-chart-head">
          <div class="saved-chart-name">
            <div class="saved-chart-title-row">
              <input
                class="saved-chart-title-input-inline"
                type="text"
                :name="`saved_chart_title_${savedChart.id}`"
                :aria-label="t('project.workspace.library.titleAria', { id: savedChart.id })"
                maxlength="255"
                :value="getSavedChartTitleDraft(savedChart)"
                @input="setSavedChartTitleDraft(savedChart.id, $event.target.value)"
                @focus="selectAllInputText($event)"
                @click="selectAllInputText($event)"
                @keydown.enter.prevent="saveSavedChartTitle(savedChart)"
              />
              <button
                v-if="hasSavedChartTitleChanges(savedChart)"
                class="btn"
                type="button"
                @click="saveSavedChartTitle(savedChart)"
              >
                {{ t('project.workspace.library.saveTitle') }}
              </button>
            </div>
            <div class="saved-chart-meta">
              {{ savedChartMeta(savedChart) }}
            </div>
          </div>
        </div>
        <div class="saved-chart-canvas">
          <ChartPanel
            embedded
            :labels="savedChart.labels"
            :datasets="savedChart.datasets"
            :meta="savedChart.meta"
            :type="savedChart.type"
            :allow-export="false"
          />
        </div>
        <div class="saved-chart-actions">
          <button class="btn" type="button" @click="$emit('download-saved-chart', savedChart)">{{ t('project.workspace.library.download') }}</button>
          <button class="btn" type="button" @click="$emit('delete-saved-chart', savedChart.id)">{{ t('common.delete') }}</button>
        </div>
      </article>
    </div>
  </div>
</template>

<script>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import ChartPanel from './ChartPanel.vue'

export default {
  name: 'ProjectSavedChartsLibrary',
  components: {
    ChartPanel,
  },
  props: {
    savedCharts: { type: Array, default: () => [] },
    savedChartsLoading: { type: Boolean, default: false },
    savedChartsError: { type: String, default: '' },
  },
  emits: [
    'refresh-saved-charts',
    'rename-saved-chart',
    'download-saved-chart',
    'delete-saved-chart',
  ],
  setup(props, { emit }) {
    const { t, locale } = useI18n({ useScope: 'global' })
    const titleDrafts = ref({})

    const normalizedSavedChartTitle = (savedChart) => {
      const value = String(savedChart?.title || '').trim()
      return value || t('project.workspace.library.untitledChart')
    }

    const savedChartMeta = (savedChart) => {
      locale.value
      const typeLabel = String(savedChart?.type || '').trim() || t('project.workspace.library.chartFallback')
      return `${typeLabel} - ${savedChart?.created_at || '-'}`
    }

    watch(
      () => props.savedCharts,
      (nextCharts) => {
        const nextDrafts = {}
        ;(nextCharts || []).forEach((savedChart) => {
          const id = Number(savedChart?.id || 0)
          if (!id) return
          const persistedTitle = normalizedSavedChartTitle(savedChart)
          const existingDraft = titleDrafts.value[id]
          nextDrafts[id] = typeof existingDraft === 'string' ? existingDraft : persistedTitle
        })
        titleDrafts.value = nextDrafts
      },
      { immediate: true }
    )

    const getSavedChartTitleDraft = (savedChart) => {
      const id = Number(savedChart?.id || 0)
      if (!id) return normalizedSavedChartTitle(savedChart)
      return titleDrafts.value[id] ?? normalizedSavedChartTitle(savedChart)
    }

    const setSavedChartTitleDraft = (savedChartId, value) => {
      const id = Number(savedChartId || 0)
      if (!id) return
      titleDrafts.value = {
        ...titleDrafts.value,
        [id]: String(value ?? ''),
      }
    }

    const selectAllInputText = (event) => {
      const input = event?.target
      if (!input || typeof input.select !== 'function') return
      requestAnimationFrame(() => input.select())
    }

    const hasSavedChartTitleChanges = (savedChart) => {
      const draft = String(getSavedChartTitleDraft(savedChart) || '').trim()
      const persisted = normalizedSavedChartTitle(savedChart)
      return Boolean(draft) && draft !== persisted
    }

    const saveSavedChartTitle = (savedChart) => {
      if (!savedChart?.id) return
      const draft = String(getSavedChartTitleDraft(savedChart) || '').trim()
      const persisted = normalizedSavedChartTitle(savedChart)
      if (!draft) {
        setSavedChartTitleDraft(savedChart.id, persisted)
        return
      }
      if (draft === persisted) return
      emit('rename-saved-chart', {
        chartId: Number(savedChart.id),
        title: draft,
      })
    }

    return {
      t,
      getSavedChartTitleDraft,
      setSavedChartTitleDraft,
      savedChartMeta,
      selectAllInputText,
      hasSavedChartTitleChanges,
      saveSavedChartTitle,
    }
  },
}
</script>

<style scoped>
.library-shell { display: flex; flex-direction: column; gap: 10px; height: 100%; overflow: auto; padding-right: 2px; }
.library-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.analysis-title { font-size: 13px; font-weight: 700; margin-bottom: 8px; }
.library-empty { color: var(--muted); font-size: 13px; border: 1px solid var(--border); border-radius: 10px; padding: 12px; }
.saved-charts-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 10px; }
.saved-chart-card { border: 1px solid var(--border); border-radius: 12px; background: #161616; padding: 10px; display: flex; flex-direction: column; gap: 10px; }
.saved-chart-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
.saved-chart-name { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.saved-chart-title-row { display: flex; align-items: center; gap: 8px; }
.saved-chart-title-input-inline {
  width: 100%;
  border: none;
  background: transparent;
  color: var(--text);
  font-size: 14px;
  font-weight: 700;
  padding: 0;
  cursor: text;
  outline: none;
}
.saved-chart-title-input-inline:focus {
  color: var(--text);
  text-decoration: none;
}
.saved-chart-meta { font-size: 12px; color: var(--muted); margin-top: 2px; }
.saved-chart-canvas { height: 320px; border: 1px solid var(--border); border-radius: 10px; padding: 6px; }
.saved-chart-actions { display: flex; flex-wrap: wrap; gap: 8px; }

@media (max-width: 760px) {
  .saved-chart-actions .btn {
    width: 100%;
  }
}
</style>
