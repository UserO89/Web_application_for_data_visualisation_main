import { flushPromises, mount, RouterLinkStub } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { vi } from 'vitest'
import i18n from '../../src/i18n'
import AppHeader from '../../src/components/AppHeader.vue'
import { withI18n } from '../support/i18n'

const mockRouteState = vi.hoisted(() => ({
  name: 'home',
  fullPath: '/',
}))

const mockRouterPush = vi.hoisted(() => vi.fn())

const mockAuthStore = vi.hoisted(() => ({
  isAuthenticated: false,
  isAdmin: false,
  user: null,
  logout: vi.fn(),
}))

const mockProjectsStore = vi.hoisted(() => ({
  loading: false,
  projects: [],
  fetchProjects: vi.fn(),
}))

const mockNotifications = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRoute: () => mockRouteState,
  useRouter: () => ({
    push: mockRouterPush,
  }),
}))

vi.mock('../../src/stores/auth', () => ({
  useAuthStore: () => mockAuthStore,
}))

vi.mock('../../src/stores/projects', () => ({
  useProjectsStore: () => mockProjectsStore,
}))

vi.mock('../../src/composables/useNotifications', () => ({
  useNotifications: () => mockNotifications,
}))

const LanguageSwitcherStub = defineComponent({
  name: 'LanguageSwitcher',
  setup() {
    return () => null
  },
})

const mountHeader = () =>
  mount(AppHeader, withI18n({
    global: {
      stubs: {
        RouterLink: RouterLinkStub,
        Transition: false,
        LanguageSwitcher: LanguageSwitcherStub,
      },
    },
  }))

describe('AppHeader', () => {
  beforeEach(() => {
    mockRouteState.name = 'home'
    mockRouteState.fullPath = '/'

    mockAuthStore.isAuthenticated = false
    mockAuthStore.isAdmin = false
    mockAuthStore.user = null
    mockAuthStore.logout.mockReset()
    mockAuthStore.logout.mockResolvedValue(undefined)

    mockProjectsStore.loading = false
    mockProjectsStore.projects = []
    mockProjectsStore.fetchProjects.mockReset()
    mockProjectsStore.fetchProjects.mockResolvedValue(undefined)

    mockRouterPush.mockReset()

    mockNotifications.success.mockReset()
    mockNotifications.error.mockReset()
    mockNotifications.warning.mockReset()
    mockNotifications.info.mockReset()
  })

  it('shows the login entry for guests outside the login page', () => {
    const wrapper = mountHeader()

    expect(wrapper.text()).toContain(i18n.global.t('nav.login'))
    expect(wrapper.find('.profile-trigger').exists()).toBe(false)
  })

  it('loads and shows quick projects when the desktop projects menu opens', async () => {
    mockAuthStore.isAuthenticated = true
    mockProjectsStore.projects = [
      { id: 4, title: '', created_at: '2026-01-01T10:00:00Z', updated_at: '2026-01-01T10:00:00Z' },
      { id: 9, title: 'Revenue Q1', created_at: '2026-03-01T10:00:00Z', updated_at: '2026-03-02T10:00:00Z' },
    ]

    const wrapper = mountHeader()

    await wrapper.get('.nav-dropdown').trigger('click')
    await flushPromises()

    expect(mockProjectsStore.fetchProjects).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toContain('Revenue Q1')
    expect(wrapper.text()).toContain(i18n.global.t('nav.projectFallback', { id: 4 }).trim())
  })

  it('logs the user out from the profile menu and redirects home', async () => {
    mockAuthStore.isAuthenticated = true
    mockAuthStore.user = {
      name: 'Data Analyst',
      avatar_url: null,
    }

    const wrapper = mountHeader()

    await wrapper.get('.profile-trigger').trigger('click')
    await wrapper.get('.menu-danger').trigger('click')
    await flushPromises()

    expect(mockAuthStore.logout).toHaveBeenCalledTimes(1)
    expect(mockNotifications.success).toHaveBeenCalledWith(i18n.global.t('nav.logoutSuccess'))
    expect(mockRouterPush).toHaveBeenCalledWith({ name: 'home' })
  })
})
