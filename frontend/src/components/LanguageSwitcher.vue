<template>
  <label :class="['language-switcher', { compact }]">
    <span v-if="showLabel" class="language-label">{{ languageLabel }}</span>
    <span v-else class="sr-only">{{ languageLabel }}</span>

    <select
      class="language-select"
      :value="currentLocale"
      :aria-label="languageLabel"
      @change="handleChange"
    >
      <option
        v-for="locale in supportedLocales"
        :key="locale.code"
        :value="locale.code"
      >
        {{ locale.nativeLabel }}
      </option>
    </select>
  </label>
</template>

<script>
import { useLocale } from '../composables/useLocale'

export default {
  name: 'LanguageSwitcher',
  props: {
    compact: {
      type: Boolean,
      default: false,
    },
    showLabel: {
      type: Boolean,
      default: true,
    },
  },
  setup() {
    const {
      currentLocale,
      languageLabel,
      supportedLocales,
      setLocale,
    } = useLocale()

    const handleChange = (event) => {
      setLocale(event.target.value)
    }

    return {
      currentLocale,
      languageLabel,
      supportedLocales,
      handleChange,
    }
  },
}
</script>

<style scoped>
.language-switcher {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.language-switcher.compact .language-label {
  display: none;
}

.language-label {
  font-size: 12px;
  color: var(--muted);
  white-space: nowrap;
}

.language-select {
  border: 1px solid var(--border);
  background: #1f1f1f;
  color: var(--text);
  border-radius: 10px;
  padding: 8px 10px;
  font-size: 13px;
  min-width: 128px;
  cursor: pointer;
}

.language-select:focus {
  outline: none;
  border-color: rgba(29, 185, 84, 0.45);
  box-shadow: 0 0 0 3px rgba(29, 185, 84, 0.14);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
