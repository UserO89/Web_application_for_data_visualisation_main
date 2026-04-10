import { flushPromises, mount } from '@vue/test-utils'
import { vi } from 'vitest'
import i18n, { getLocale, setLocale } from '../../src/i18n'
import LanguageSwitcher from '../../src/components/LanguageSwitcher.vue'
import { withI18n } from '../support/i18n'

const mockAuthStore = vi.hoisted(() => ({
  isAuthenticated: false,
  updatePreferredLocale: vi.fn(),
}))

const mockNotifications = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
}))

vi.mock('../../src/stores/auth', () => ({
  useAuthStore: () => mockAuthStore,
}))

vi.mock('../../src/composables/useNotifications', () => ({
  useNotifications: () => mockNotifications,
}))

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    setLocale('en')
    mockAuthStore.isAuthenticated = false
    mockAuthStore.updatePreferredLocale.mockReset()
    mockNotifications.success.mockReset()
    mockNotifications.error.mockReset()
    mockNotifications.warning.mockReset()
    mockNotifications.info.mockReset()
  })

  it('opens the language menu from the icon trigger and switches locale locally for guests', async () => {
    const wrapper = mount(LanguageSwitcher, withI18n({
      props: {
        compact: true,
        showLabel: false,
      },
    }))

    const trigger = wrapper.get('.language-trigger')
    expect(trigger.attributes('aria-expanded')).toBe('false')

    await trigger.trigger('click')
    expect(trigger.attributes('aria-expanded')).toBe('true')

    await wrapper.get('[data-locale="ru"]').trigger('click')

    expect(i18n.global.locale.value).toBe('ru')
    expect(getLocale()).toBe('ru')
    expect(mockAuthStore.updatePreferredLocale).not.toHaveBeenCalled()
    expect(trigger.attributes('aria-expanded')).toBe('false')
  })

  it('persists the selected locale for authenticated users', async () => {
    mockAuthStore.isAuthenticated = true
    mockAuthStore.updatePreferredLocale.mockResolvedValue({
      user: { id: 7, locale: 'uk' },
    })

    const wrapper = mount(LanguageSwitcher, withI18n({
      props: {
        compact: true,
        showLabel: false,
      },
    }))

    await wrapper.get('.language-trigger').trigger('click')
    await wrapper.get('[data-locale="uk"]').trigger('click')
    await flushPromises()

    expect(mockAuthStore.updatePreferredLocale).toHaveBeenCalledWith('uk')
    expect(getLocale()).toBe('uk')
    expect(mockNotifications.error).not.toHaveBeenCalled()
  })

  it('rolls back the locale when the persisted update fails', async () => {
    mockAuthStore.isAuthenticated = true
    mockAuthStore.updatePreferredLocale.mockRejectedValue({
      response: {
        data: {
          message: 'Failed to save language preference.',
        },
      },
    })

    const wrapper = mount(LanguageSwitcher, withI18n({
      props: {
        compact: true,
        showLabel: false,
      },
    }))

    await wrapper.get('.language-trigger').trigger('click')
    await wrapper.get('[data-locale="sk"]').trigger('click')
    await flushPromises()

    expect(mockAuthStore.updatePreferredLocale).toHaveBeenCalledWith('sk')
    expect(getLocale()).toBe('en')
    expect(mockNotifications.error).toHaveBeenCalledWith('Failed to save language preference.')
  })
})
