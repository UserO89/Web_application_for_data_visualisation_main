<template>
  <div class="field-selector">
    <label>{{ label }}</label>
    <select
      class="field-select"
      :value="modelValue ?? ''"
      :disabled="disabled"
      @change="$emit('update:modelValue', normalizeValue($event.target.value))"
    >
      <option value="">{{ placeholder || 'Not selected' }}</option>
      <option
        v-for="column in options"
        :key="column.id"
        :value="column.id"
      >
        {{ column.name }} ({{ typeLabel(column.semanticType) }})
      </option>
    </select>
    <div v-if="hint" class="field-hint">{{ hint }}</div>
  </div>
</template>

<script>
import { SEMANTIC_TYPE_LABELS } from '../charts/ui/typeLabels'

export default {
  name: 'ChartFieldSelector',
  props: {
    label: { type: String, required: true },
    modelValue: { type: [Number, String, null], default: null },
    options: { type: Array, default: () => [] },
    placeholder: { type: String, default: '' },
    hint: { type: String, default: '' },
    disabled: { type: Boolean, default: false },
  },
  emits: ['update:modelValue'],
  setup() {
    const normalizeValue = (value) => {
      if (!value) return null
      const parsed = Number(value)
      return Number.isFinite(parsed) ? parsed : null
    }
    const typeLabel = (semanticType) => SEMANTIC_TYPE_LABELS[semanticType] || semanticType || 'Unknown'
    return { normalizeValue, typeLabel }
  },
}
</script>

<style scoped>
.field-selector { display: flex; flex-direction: column; gap: 4px; }
.field-selector label { font-size: 12px; color: var(--muted); }
.field-select {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  color: var(--text);
  padding: 7px 9px;
  font-size: 13px;
}
.field-hint { font-size: 11px; color: var(--muted); }
</style>
