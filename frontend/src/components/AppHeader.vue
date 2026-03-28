<template>
  <header class="app-header">
    <div class="header-main-row">
      <div class="header-left">
        <router-link :to="{ name: 'home' }" class="brand home-link">
          <div class="logo">DV</div>
          <div class="title">DataViz</div>
        </router-link>

        <div class="desktop-nav-group">
          <router-link :to="{ name: 'home' }" class="nav-btn">Home</router-link>
          <div v-if="authStore.isAuthenticated" class="projects-nav" ref="projectsWrap">
            <button
              class="nav-btn nav-dropdown"
              type="button"
              :class="{ active: isProjectsRoute }"
              :aria-expanded="projectsMenuOpen.toString()"
              aria-haspopup="menu"
              @click="toggleProjectsMenu"
            >
              <span>Projects</span>
              <span class="dropdown-chevron" :class="{ open: projectsMenuOpen }" aria-hidden="true">
                <svg viewBox="0 0 16 16" fill="none">
                  <path d="M3 6l5 5 5-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
            </button>

            <transition name="fade-slide">
              <div v-if="projectsMenuOpen" class="projects-menu" role="menu">
                <router-link :to="{ name: 'projects' }" class="projects-item projects-all" @click="closeProjectsMenu">
                  Open Projects
                </router-link>
                <div class="projects-divider"></div>

                <div v-if="projectsStore.loading && !quickProjects.length" class="projects-empty">
                  Loading projects...
                </div>
                <template v-else-if="quickProjects.length">
                  <router-link
                    v-for="project in quickProjects"
                    :key="`quick-project-${project.id}`"
                    :to="{ name: 'project', params: { id: project.id } }"
                    class="projects-item"
                    @click="closeProjectsMenu"
                  >
                    <span class="projects-item-title">{{ projectTitle(project) }}</span>
                  </router-link>
                </template>
                <div v-else class="projects-empty">No projects yet.</div>
              </div>
            </transition>
          </div>
          <router-link v-if="isAdmin" :to="{ name: 'admin' }" class="nav-btn">Admin</router-link>
        </div>
      </div>

      <div class="header-actions">
        <button
          ref="compactNavButton"
          type="button"
          class="compact-menu-btn"
          :aria-expanded="compactNavOpen.toString()"
          aria-controls="compact-nav-accordion"
          aria-label="Toggle navigation menu"
          @click.stop="toggleCompactNav"
        >
          <svg v-if="!compactNavOpen" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/>
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/>
          </svg>
        </button>

        <div class="header-right" ref="profileWrap">
          <router-link v-if="showGuestLogin" :to="{ name: 'login' }" class="btn">
            Log in
          </router-link>

          <template v-else-if="authStore.isAuthenticated">
            <button
              class="profile-trigger"
              @click="toggleMenu"
              type="button"
              :aria-expanded="menuOpen.toString()"
              aria-haspopup="menu"
            >
              <span class="profile-name">{{ displayName }}</span>
              <img
                v-if="avatarUrl"
                :src="avatarUrl"
                alt="avatar"
                class="avatar"
              />
              <div v-else class="avatar avatar-fallback">{{ initials }}</div>
            </button>

            <transition name="fade-slide">
              <div v-if="menuOpen" class="profile-menu" role="menu">
                <router-link :to="{ name: 'projects' }" class="menu-item" @click="closeMenu">
                  <span class="menu-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none"><path d="M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z" stroke="currentColor" stroke-width="1.8"/></svg>
                  </span>
                  Projects
                </router-link>
                <router-link :to="{ name: 'profile' }" class="menu-item" @click="closeMenu">
                  <span class="menu-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none"><path d="M12 12a4 4 0 1 0-0.001-8.001A4 4 0 0 0 12 12zm0 2c-4.2 0-7 2.1-7 5v1h14v-1c0-2.9-2.8-5-7-5z" stroke="currentColor" stroke-width="1.8"/></svg>
                  </span>
                  Profile
                </router-link>
                <div class="menu-divider"></div>
                <button class="menu-item menu-danger" @click="handleLogout" type="button">
                  <span class="menu-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none"><path d="M14 7V4h6v16h-6v-3M10 12h10M10 12l3-3M10 12l3 3M4 4h6v4H8v8h2v4H4z" stroke="currentColor" stroke-width="1.8"/></svg>
                  </span>
                  Logout
                </button>
              </div>
            </transition>
          </template>
        </div>
      </div>
    </div>

    <transition name="fade-slide">
      <div
        v-if="compactNavOpen"
        id="compact-nav-accordion"
        ref="compactNavPanel"
        class="compact-nav-accordion"
        @click.stop
      >
        <router-link :to="{ name: 'home' }" class="compact-nav-item" @click="closeCompactNav">
          Home
        </router-link>

        <button
          v-if="authStore.isAuthenticated"
          class="compact-nav-item compact-projects-toggle"
          type="button"
          :aria-expanded="compactProjectsOpen.toString()"
          @click="toggleCompactProjects"
        >
          <span>Projects</span>
          <span class="compact-chevron" :class="{ open: compactProjectsOpen }" aria-hidden="true">
            <svg viewBox="0 0 16 16" fill="none">
              <path d="M3 6l5 5 5-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
        </button>

        <div v-if="authStore.isAuthenticated && compactProjectsOpen" class="compact-projects-list">
          <router-link :to="{ name: 'projects' }" class="compact-project-item" @click="closeCompactNav">
            Open Projects
          </router-link>
          <router-link
            v-for="project in quickProjects"
            :key="`compact-project-${project.id}`"
            :to="{ name: 'project', params: { id: project.id } }"
            class="compact-project-item"
            @click="closeCompactNav"
          >
            {{ projectTitle(project) }}
          </router-link>
        </div>

        <router-link v-if="isAdmin" :to="{ name: 'admin' }" class="compact-nav-item" @click="closeCompactNav">
          Admin
        </router-link>
      </div>
    </transition>
  </header>
</template>

<script>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useProjectsStore } from '../stores/projects'
import { useNotifications } from '../composables/useNotifications'
import { extractApiErrorMessage } from '../utils/api/errors'
import { getInitials } from '../utils/display'

export default {
  name: 'AppHeader',
  setup() {
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

    const showGuestLogin = computed(() => {
      return !authStore.isAuthenticated && route.name !== 'login'
    })
    const isAdmin = computed(() => authStore.isAdmin)
    const isProjectsRoute = computed(() => route.name === 'projects' || route.name === 'project')
    const quickProjects = computed(() => {
      const list = Array.isArray(projectsStore.projects) ? projectsStore.projects : []
      return [...list]
        .sort((a, b) => {
          const ta = Date.parse(a?.updated_at || a?.created_at || 0) || 0
          const tb = Date.parse(b?.updated_at || b?.created_at || 0) || 0
          return tb - ta
        })
        .slice(0, 12)
    })

    const displayName = computed(() => authStore.user?.name || 'User')
    const avatarUrl = computed(() => authStore.user?.avatar_url || null)

    const initials = computed(() => {
      return getInitials(authStore.user?.name || 'User', 'U')
    })

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

    const loadProjects = async () => {
      if (!authStore.isAuthenticated || projectsStore.loading) return
      try {
        await projectsStore.fetchProjects()
      } catch (_) {}
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
      if (menuOpen.value) closeProjectsMenu()
      if (menuOpen.value) closeCompactNav()
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
        closeMenu()
        closeProjectsMenu()
        closeCompactNav()
      }
    }

    const handleLogout = async () => {
      try {
        await authStore.logout()
        closeMenu()
        closeProjectsMenu()
        closeCompactNav()
        notify.success('Logged out successfully.')
        router.push({ name: 'home' })
      } catch (error) {
        notify.error(extractApiErrorMessage(error, 'Failed to log out.'))
      }
    }

    const projectTitle = (project) => {
      const value = String(project?.title || '').trim()
      if (value) return value
      return `Project #${project?.id ?? ''}`.trim()
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
      closeMenu()
      closeProjectsMenu()
      closeCompactNav()
    })

    return {
      authStore,
      projectsStore,
      menuOpen,
      projectsMenuOpen,
      compactNavOpen,
      compactProjectsOpen,
      profileWrap,
      projectsWrap,
      compactNavButton,
      compactNavPanel,
      showGuestLogin,
      isAdmin,
      isProjectsRoute,
      quickProjects,
      displayName,
      avatarUrl,
      initials,
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

.desktop-nav-group {
  display: flex;
  align-items: center;
  gap: 12px;
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

.nav-btn {
  text-decoration: none;
  color: var(--muted);
  border: 1px solid var(--border);
  background: #1f1f1f;
  padding: 7px 10px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.16s ease;
  white-space: nowrap;
}

.nav-btn:hover {
  color: var(--text);
  background: #2a2a2a;
}

.nav-btn.router-link-exact-active {
  color: #b9f0c9;
  border-color: rgba(29, 185, 84, 0.45);
  background: rgba(29, 185, 84, 0.16);
}

.projects-nav {
  position: relative;
}

.nav-dropdown {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.dropdown-chevron {
  width: 13px;
  height: 13px;
  color: var(--muted);
  transition: transform 0.16s ease;
}

.dropdown-chevron svg {
  width: 13px;
  height: 13px;
  display: block;
}

.dropdown-chevron.open {
  transform: rotate(180deg);
}

.nav-btn.active,
.nav-dropdown[aria-expanded="true"] {
  color: #b9f0c9;
  border-color: rgba(29, 185, 84, 0.45);
  background: rgba(29, 185, 84, 0.16);
}

.projects-menu {
  position: absolute;
  top: calc(100% + 10px);
  left: 0;
  width: 280px;
  max-height: 360px;
  overflow: auto;
  background: #1d1d1d;
  border: 1px solid var(--border);
  border-radius: 14px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.45);
  padding: 7px;
  z-index: 35;
}

.projects-item {
  display: block;
  width: 100%;
  padding: 10px 11px;
  border-radius: 8px;
  text-decoration: none;
  color: var(--text);
  font-size: 13px;
  transition: all 0.14s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.projects-item:hover {
  background: #2a2a2a;
  transform: translateX(2px);
}

.projects-item.projects-all {
  color: #93f6b3;
  font-weight: 600;
}

.projects-item-title {
  display: block;
  width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.projects-divider {
  height: 1px;
  background: var(--border);
  margin: 6px 4px;
}

.projects-empty {
  padding: 10px 11px;
  font-size: 12px;
  color: var(--muted);
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

.header-right {
  position: relative;
  flex: 0 0 auto;
}

.profile-trigger {
  border: 1px solid transparent;
  background: transparent;
  color: inherit;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 999px;
  transition: all 0.16s ease;
}

.profile-trigger:hover,
.profile-trigger[aria-expanded="true"] {
  border-color: var(--border);
  background: #1f1f1f;
}

.profile-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  min-width: 0;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.avatar {
  width: 38px;
  height: 38px;
  border-radius: 999px;
  object-fit: cover;
  border: 1px solid var(--border);
}

.avatar-fallback {
  display: grid;
  place-items: center;
  background: #2a2a2a;
  color: var(--text);
  font-size: 12px;
  font-weight: 700;
}

.profile-menu {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  min-width: 210px;
  background: #1d1d1d;
  border: 1px solid var(--border);
  border-radius: 14px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.45);
  padding: 7px;
  z-index: 30;
  overflow: hidden;
}

.menu-item {
  display: block;
  width: 100%;
  border: none;
  text-align: left;
  padding: 11px 12px;
  border-radius: 8px;
  background: transparent;
  color: var(--text);
  text-decoration: none;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.14s ease;
}

.menu-item:hover {
  background: #2a2a2a;
  transform: translateX(2px);
}

.menu-icon {
  width: 16px;
  height: 16px;
  color: var(--muted);
  flex: 0 0 auto;
}

.menu-icon svg {
  width: 16px;
  height: 16px;
  display: block;
}

.menu-divider {
  height: 1px;
  background: var(--border);
  margin: 6px 4px;
}

.menu-danger {
  color: #ff9b9b;
}

.compact-nav-accordion {
  display: none;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.18s cubic-bezier(0.2, 0.9, 0.3, 1);
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.98);
}

@media (max-width: 860px) {
  .desktop-nav-group {
    display: none;
  }

  .compact-menu-btn {
    display: inline-flex;
  }

  .compact-nav-accordion {
    display: flex;
    flex-direction: column;
    gap: 8px;
    border: 1px solid var(--border);
    border-radius: 12px;
    background: #1c1c1c;
    padding: 10px;
  }

  .compact-nav-item {
    width: 100%;
    border: 1px solid var(--border);
    background: #222222;
    color: var(--text);
    border-radius: 10px;
    text-decoration: none;
    font-size: 13px;
    font-weight: 600;
    padding: 10px 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    cursor: pointer;
    transition: all 0.16s ease;
  }

  .compact-nav-item:hover {
    background: #2a2a2a;
  }

  .compact-projects-toggle {
    border: 1px solid var(--border);
  }

  .compact-chevron {
    width: 14px;
    height: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--muted);
    transition: transform 0.16s ease;
  }

  .compact-chevron svg {
    width: 14px;
    height: 14px;
    display: block;
  }

  .compact-chevron.open {
    transform: rotate(180deg);
  }

  .compact-projects-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
    border: 1px solid var(--border);
    background: #181818;
    border-radius: 10px;
    padding: 8px;
  }

  .compact-project-item {
    display: block;
    padding: 8px 10px;
    border-radius: 8px;
    text-decoration: none;
    color: var(--text);
    font-size: 13px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: all 0.14s ease;
  }

  .compact-project-item:hover {
    background: #2a2a2a;
  }

  .profile-name {
    max-width: 120px;
  }

  .projects-menu {
    width: min(320px, 92vw);
  }

  .profile-menu {
    min-width: min(240px, 92vw);
    right: 0;
    left: auto;
  }
}

@media (max-width: 560px) {
  .profile-trigger {
    gap: 6px;
    padding: 4px;
  }

  .profile-name {
    display: none;
  }

  .avatar {
    width: 34px;
    height: 34px;
  }

  .compact-nav-accordion {
    padding: 8px;
  }
}
</style>
