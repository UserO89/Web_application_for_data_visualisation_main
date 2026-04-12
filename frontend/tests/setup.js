import { beforeEach } from 'vitest'
import { setLocale } from '../src/i18n'

const ensureEnglishNavigator = () => {
  if (typeof navigator === 'undefined') return

  Object.defineProperty(navigator, 'language', {
    configurable: true,
    value: 'en-US',
  })
  Object.defineProperty(navigator, 'languages', {
    configurable: true,
    value: ['en-US', 'en'],
  })
}

const clearBrowserStorage = () => {
  try {
    globalThis.localStorage?.clear()
  } catch {}

  try {
    globalThis.sessionStorage?.clear()
  } catch {}
}

ensureEnglishNavigator()
clearBrowserStorage()
setLocale('en')

beforeEach(() => {
  ensureEnglishNavigator()
  clearBrowserStorage()
  setLocale('en')
})
