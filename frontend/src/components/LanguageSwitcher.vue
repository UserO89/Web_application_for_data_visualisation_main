<template>
  <div ref="root" :class="['language-switcher', { compact }]">
    <span v-if="showLabel" class="language-label">{{ languageLabel }}</span>
    <span v-else class="sr-only">{{ languageLabel }}</span>

    <button
      type="button"
      class="language-trigger"
      :aria-label="languageLabel"
      :aria-expanded="menuOpen.toString()"
      aria-haspopup="menu"
      :title="languageLabel"
      @click="toggleMenu"
    >
<svg class="language-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <path d="M4.5 5.5h9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
  <path d="M8.7 5.5l0.8-1.3 0.8 1.3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M6.8 9.3l4 4.2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
  <path d="M12.8 9.5l-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
  <path d="M14.5 18l3-9 3 9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M15.8 13.8h3.4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
</svg>
    </button>

    <transition name="fade-pop">
      <div v-if="menuOpen" class="language-menu" role="menu">
        <button
          v-for="locale in supportedLocales"
          :key="locale.code"
          type="button"
          class="language-option"
          :class="{ active: locale.code === currentLocale }"
          :data-locale="locale.code"
          role="menuitemradio"
          :aria-checked="(locale.code === currentLocale).toString()"
          :disabled="savingLocale"
          @click="selectLocale(locale.code)"
        >
          <span class="language-option-name">{{ locale.nativeLabel }}</span>
          <span v-if="locale.code === currentLocale" class="language-option-check" aria-hidden="true">
            <svg viewBox="0 0 16 16" fill="none">
              <path d="M3.5 8.2 6.6 11l5.9-6.4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
        </button>
      </div>
    </transition>
  </div>
</template>

<script>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLocale } from '../composables/useLocale'
import { useNotifications } from '../composables/useNotifications'
import { useAuthStore } from '../stores/auth'
import { extractApiErrorMessage } from '../utils/api/errors'

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
    const { t } = useI18n({ useScope: 'global' })
    const {
      currentLocale,
      languageLabel,
      supportedLocales,
      setLocale,
    } = useLocale()
    const authStore = useAuthStore()
    const notify = useNotifications()
    const menuOpen = ref(false)
    const root = ref(null)
    const savingLocale = ref(false)

    const closeMenu = () => {
      menuOpen.value = false
    }

    const toggleMenu = () => {
      menuOpen.value = !menuOpen.value
    }

    const selectLocale = async (localeCode) => {
      if (localeCode === currentLocale.value || savingLocale.value) {
        closeMenu()
        return
      }

      const previousLocale = currentLocale.value
      setLocale(localeCode)
      closeMenu()

      if (!authStore.isAuthenticated) {
        return
      }

      savingLocale.value = true

      try {
        await authStore.updatePreferredLocale(localeCode)
      } catch (error) {
        setLocale(previousLocale)
        notify.error(extractApiErrorMessage(error, t('profile.language.updateFailed')))
      } finally {
        savingLocale.value = false
      }
    }

    const isInside = (event, element) => {
      if (!element) return false
      if (typeof event.composedPath === 'function') {
        return event.composedPath().includes(element)
      }

      return element.contains(event.target)
    }

    const handleOutsideClick = (event) => {
      if (!isInside(event, root.value)) {
        closeMenu()
      }
    }

    const handleKeydown = (event) => {
      if (event.key === 'Escape') {
        closeMenu()
      }
    }

    onMounted(() => {
      document.addEventListener('click', handleOutsideClick)
      document.addEventListener('keydown', handleKeydown)
    })

    onBeforeUnmount(() => {
      document.removeEventListener('click', handleOutsideClick)
      document.removeEventListener('keydown', handleKeydown)
    })

    return {
      currentLocale,
      languageLabel,
      supportedLocales,
      menuOpen,
      root,
      savingLocale,
      toggleMenu,
      selectLocale,
    }
  },
}
</script>

<style scoped>
.language-switcher {
  position: relative;
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

.language-trigger {
  border: 1px solid var(--border);
  background: #1f1f1f;
  color: var(--muted);
  width: 36px;
  height: 36px;
  padding: 0;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.16s ease;
}

.language-trigger:hover,
.language-trigger[aria-expanded="true"] {
  color: #b9f0c9;
  border-color: rgba(29, 185, 84, 0.45);
  background: rgba(29, 185, 84, 0.16);
}

.language-trigger:focus-visible,
.language-option:focus-visible {
  outline: none;
  border-color: rgba(29, 185, 84, 0.45);
  box-shadow: 0 0 0 3px rgba(29, 185, 84, 0.14);
}

.language-icon {
  width: 18px;
  height: 18px;
  display: block;
}

.language-menu {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  min-width: 180px;
  padding: 7px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: #1d1d1d;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.45);
  z-index: 45;
}

.language-option {
  width: 100%;
  border: 1px solid transparent;
  background: transparent;
  color: var(--text);
  padding: 10px 11px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  text-align: left;
  cursor: pointer;
  transition: all 0.14s ease;
}

.language-option:hover {
  background: #2a2a2a;
  transform: translateX(2px);
}

.language-option:disabled {
  opacity: 0.7;
  cursor: wait;
  transform: none;
}

.language-option.active {
  color: #b9f0c9;
  background: rgba(29, 185, 84, 0.16);
  border-color: rgba(29, 185, 84, 0.25);
}

.language-option-name {
  white-space: nowrap;
}

.language-option-check {
  width: 16px;
  height: 16px;
  color: currentColor;
  flex: 0 0 auto;
}

.language-option-check svg {
  width: 16px;
  height: 16px;
  display: block;
}

.fade-pop-enter-active,
.fade-pop-leave-active {
  transition: all 0.16s ease;
}

.fade-pop-enter-from,
.fade-pop-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.98);
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
