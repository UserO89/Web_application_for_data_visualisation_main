import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { setLocale, SUPPORTED_LOCALES } from '../i18n'

export function useLocale() {
  const { locale, t } = useI18n({ useScope: 'global' })

  const currentLocale = computed(() => locale.value)
  const languageLabel = computed(() => t('common.language'))

  const updateLocale = (nextLocale) => {
    setLocale(nextLocale)
  }

  return {
    currentLocale,
    languageLabel,
    supportedLocales: SUPPORTED_LOCALES,
    setLocale: updateLocale,
  }
}
