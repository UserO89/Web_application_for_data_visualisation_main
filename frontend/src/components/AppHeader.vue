<template>
  <header class="app-header">
    <div class="header-main-row">
      <div class="header-left">
        <router-link :to="{ name: 'home' }" class="brand home-link">
          <div class="logo">DV</div>
          <div class="title">DataViz</div>
        </router-link>

        <AppHeaderDesktopNav
          :is-authenticated="authStore.isAuthenticated"
          :is-admin="isAdmin"
          :is-projects-route="isProjectsRoute"
          :projects-menu-open="projectsMenuOpen"
          :projects-loading="projectsStore.loading"
          :quick-projects="quickProjects"
          :project-title="projectTitle"
          :set-projects-wrap-ref="setProjectsWrapRef"
          @toggle-projects-menu="toggleProjectsMenu"
          @close-projects-menu="closeProjectsMenu"
        />
      </div>

      <div class="header-actions">
        <LanguageSwitcher :show-label="false" compact />

        <button
          ref="compactNavButton"
          type="button"
          class="compact-menu-btn"
          :aria-expanded="compactNavOpen.toString()"
          aria-controls="compact-nav-accordion"
          :aria-label="t('nav.toggleNavigation')"
          @click.stop="toggleCompactNav"
        >
          <svg v-if="!compactNavOpen" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/>
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/>
          </svg>
        </button>

        <AppHeaderProfileMenu
          :show-guest-login="showGuestLogin"
          :is-authenticated="authStore.isAuthenticated"
          :menu-open="menuOpen"
          :display-name="displayName"
          :avatar-url="avatarUrl"
          :initials="initials"
          :set-profile-wrap-ref="setProfileWrapRef"
          @toggle-menu="toggleMenu"
          @close-menu="closeMenu"
          @logout="handleLogout"
        />
      </div>
    </div>

    <AppHeaderCompactNav
      :open="compactNavOpen"
      :is-authenticated="authStore.isAuthenticated"
      :compact-projects-open="compactProjectsOpen"
      :is-admin="isAdmin"
      :quick-projects="quickProjects"
      :project-title="projectTitle"
      :set-compact-nav-panel-ref="setCompactNavPanelRef"
      @close-compact-nav="closeCompactNav"
      @toggle-compact-projects="toggleCompactProjects"
    />
  </header>
</template>

<script>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useProjectsStore } from '../stores/projects'
import { useNotifications } from '../composables/useNotifications'
import { extractApiErrorMessage } from '../utils/api/errors'
import { getInitials } from '../utils/display'
import LanguageSwitcher from './LanguageSwitcher.vue'
import AppHeaderCompactNav from './header/AppHeaderCompactNav.vue'
import AppHeaderDesktopNav from './header/AppHeaderDesktopNav.vue'
import AppHeaderProfileMenu from './header/AppHeaderProfileMenu.vue'

export default {
  name: 'AppHeader',
  components: {
    LanguageSwitcher,
    AppHeaderCompactNav,
    AppHeaderDesktopNav,
    AppHeaderProfileMenu,
  },
  setup() {
    const { t } = useI18n({ useScope: 'global' })
    const route = useRoute()
    const router = useRouter()
    const authStore = useAuthStore()
    const projectsStore = useProjectsStore()
    const notify = useNotifications()

    const menuOpen = ref(false)
    const projectsMenuOpen = ref(false)
    const compactNavOpen = ref(false)
    const compactProjectsOpen = ref(false)
    const profileWrap = ref(null)
    const projectsWrap = ref(null)
    const compactNavButton = ref(null)
    const compactNavPanel = ref(null)

    const showGuestLogin = computed(() => !authStore.isAuthenticated && route.name !== 'login')
    const isAdmin = computed(() => authStore.isAdmin)
    const isProjectsRoute = computed(() => route.name === 'projects' || route.name === 'project')
    const quickProjects = computed(() => {
      const list = Array.isArray(projectsStore.projects) ? projectsStore.projects : []

      return [...list]
        .sort((left, right) => {
          const leftTime = Date.parse(left?.updated_at || left?.created_at || 0) || 0
          const rightTime = Date.parse(right?.updated_at || right?.created_at || 0) || 0
          return rightTime - leftTime
        })
        .slice(0, 12)
    })
    const displayName = computed(() => authStore.user?.name || t('common.user'))
    const avatarUrl = computed(() => authStore.user?.avatar_url || null)
    const initials = computed(() => {
      const fallbackName = displayName.value || t('common.user')
      return getInitials(fallbackName, fallbackName.charAt(0).toUpperCase() || 'U')
    })

    const setProfileWrapRef = (element) => {
      profileWrap.value = element
    }

    const setProjectsWrapRef = (element) => {
      projectsWrap.value = element
    }

    const setCompactNavPanelRef = (element) => {
      compactNavPanel.value = element
    }

    const closeMenu = () => {
      menuOpen.value = false
    }

    const closeProjectsMenu = () => {
      projectsMenuOpen.value = false
    }

    const closeCompactProjects = () => {
      compactProjectsOpen.value = false
    }

    const closeCompactNav = () => {
      compactNavOpen.value = false
      closeCompactProjects()
    }

    const closeAllMenus = () => {
      closeMenu()
      closeProjectsMenu()
      closeCompactNav()
    }

    const loadProjects = async () => {
      if (!authStore.isAuthenticated || projectsStore.loading) return

      try {
        await projectsStore.fetchProjects()
      } catch {}
    }

    const toggleProjectsMenu = async () => {
      closeCompactNav()
      const willOpen = !projectsMenuOpen.value
      projectsMenuOpen.value = willOpen
      if (!willOpen) return

      closeMenu()
      await loadProjects()
    }

    const toggleCompactNav = () => {
      const willOpen = !compactNavOpen.value
      compactNavOpen.value = willOpen

      if (!willOpen) {
        closeCompactProjects()
        return
      }

      closeMenu()
      closeProjectsMenu()
    }

    const toggleCompactProjects = async () => {
      if (!authStore.isAuthenticated) return

      const willOpen = !compactProjectsOpen.value
      compactProjectsOpen.value = willOpen
      if (!willOpen) return

      await loadProjects()
    }

    const toggleMenu = () => {
      menuOpen.value = !menuOpen.value
      if (menuOpen.value) {
        closeProjectsMenu()
        closeCompactNav()
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
      const insideProfile = isInside(event, profileWrap.value)
      const insideProjects = isInside(event, projectsWrap.value)
      const insideCompactButton = isInside(event, compactNavButton.value)
      const insideCompactPanel = isInside(event, compactNavPanel.value)

      if (!insideProfile) {
        closeMenu()
      }
      if (!insideProjects) {
        closeProjectsMenu()
      }
      if (!insideCompactButton && !insideCompactPanel) {
        closeCompactNav()
      }
    }

    const handleKeydown = (event) => {
      if (event.key === 'Escape') {
        closeAllMenus()
      }
    }

    const handleLogout = async () => {
      try {
        await authStore.logout()
        closeAllMenus()
        notify.success(t('nav.logoutSuccess'))
        router.push({ name: 'home' })
      } catch (error) {
        notify.error(extractApiErrorMessage(error, t('nav.logoutFailed')))
      }
    }

    const projectTitle = (project) => {
      const value = String(project?.title || '').trim()
      if (value) return value
      return t('nav.projectFallback', { id: project?.id ?? '' }).trim()
    }

    onMounted(() => {
      document.addEventListener('click', handleOutsideClick)
      document.addEventListener('keydown', handleKeydown)
    })

    onBeforeUnmount(() => {
      document.removeEventListener('click', handleOutsideClick)
      document.removeEventListener('keydown', handleKeydown)
    })

    watch(() => route.fullPath, () => {
      closeAllMenus()
    })

    return {
      authStore,
      projectsStore,
      t,
      menuOpen,
      projectsMenuOpen,
      compactNavOpen,
      compactProjectsOpen,
      compactNavButton,
      showGuestLogin,
      isAdmin,
      isProjectsRoute,
      quickProjects,
      displayName,
      avatarUrl,
      initials,
      setProfileWrapRef,
      setProjectsWrapRef,
      setCompactNavPanelRef,
      closeMenu,
      closeProjectsMenu,
      closeCompactNav,
      toggleProjectsMenu,
      toggleCompactNav,
      toggleCompactProjects,
      toggleMenu,
      handleLogout,
      projectTitle,
    }
  },
}
</script>

<style scoped>
.app-header {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 12px;
}

.header-main-row {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1 1 auto;
  min-width: 0;
}

.home-link {
  text-decoration: none;
  color: inherit;
  flex: 0 0 auto;
}

.title {
  font-weight: 700;
  font-size: 20px;
  letter-spacing: 0.01em;
}

.header-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.compact-menu-btn {
  display: none;
  border: 1px solid var(--border);
  background: #1f1f1f;
  color: var(--muted);
  width: 38px;
  height: 38px;
  border-radius: 10px;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.16s ease;
}

.compact-menu-btn svg {
  width: 18px;
  height: 18px;
  display: block;
}

.compact-menu-btn:hover,
.compact-menu-btn[aria-expanded="true"] {
  color: #b9f0c9;
  border-color: rgba(29, 185, 84, 0.45);
  background: rgba(29, 185, 84, 0.16);
}

@media (max-width: 860px) {
  .compact-menu-btn {
    display: inline-flex;
  }
}
</style>
