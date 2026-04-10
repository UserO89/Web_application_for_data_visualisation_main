<template>
  <section class="panel">
    <div class="section-head">
      <div>
        <div class="section-title">{{ $t('admin.stats.title') }}</div>
        <div class="section-subtitle">{{ $t('admin.stats.subtitle') }}</div>
      </div>
      <button class="btn" type="button" :disabled="refreshDisabled" @click="$emit('refresh')">
        {{ $t('admin.stats.refresh') }}
      </button>
    </div>

    <div v-if="error" class="error-text">{{ error }}</div>
    <div v-if="loading" class="loading">{{ $t('admin.stats.loading') }}</div>
    <div v-else class="stats-grid">
      <div v-for="card in cards" :key="card.key" class="stat-card">
        <div class="stat-title">{{ card.label }}</div>
        <div class="stat-value">{{ card.value }}</div>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  name: 'AdminStatsSection',
  props: {
    loading: {
      type: Boolean,
      default: false,
    },
    error: {
      type: String,
      default: '',
    },
    cards: {
      type: Array,
      default: () => [],
    },
    refreshDisabled: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['refresh'],
}
</script>

<style scoped>
.section-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 14px;
}

.section-title {
  font-size: 20px;
  font-weight: 700;
}

.section-subtitle {
  color: var(--muted);
  font-size: 13px;
  margin-top: 4px;
  line-height: 1.45;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.loading {
  color: var(--muted);
  text-align: center;
  padding: 20px;
}

.error-text {
  color: #ff9b9b;
  font-size: 13px;
  margin-bottom: 10px;
}

@media (max-width: 980px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 680px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
