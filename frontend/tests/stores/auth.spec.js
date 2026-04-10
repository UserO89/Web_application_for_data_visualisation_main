import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getLocale, setLocale } from '../../src/i18n'
import { useAuthStore } from '../../src/stores/auth'

const mockAuthApi = vi.hoisted(() => ({
  register: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  me: vi.fn(),
  updateProfile: vi.fn(),
  updatePassword: vi.fn(),
  deleteAccount: vi.fn(),
  uploadAvatar: vi.fn(),
}))

vi.mock('../../src/api/auth', () => ({
  authApi: mockAuthApi,
}))

describe('auth store locale sync', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    setLocale('en')

    Object.values(mockAuthApi).forEach((fn) => fn.mockReset())
  })

  it('hydrates the active locale from the authenticated user response', async () => {
    mockAuthApi.me.mockResolvedValue({
      user: { id: 11, name: 'Locale User', role: 'user', locale: 'uk' },
    })

    const store = useAuthStore()
    await store.fetchUser()

    expect(store.user).toMatchObject({ id: 11, locale: 'uk' })
    expect(getLocale()).toBe('uk')
  })

  it('persists locale updates through the profile endpoint', async () => {
    mockAuthApi.updateProfile.mockResolvedValue({
      user: { id: 11, name: 'Locale User', role: 'user', locale: 'ru' },
    })

    const store = useAuthStore()
    await store.updatePreferredLocale('ru')

    expect(mockAuthApi.updateProfile).toHaveBeenCalledWith({ locale: 'ru' })
    expect(store.user).toMatchObject({ id: 11, locale: 'ru' })
    expect(getLocale()).toBe('ru')
  })
})
