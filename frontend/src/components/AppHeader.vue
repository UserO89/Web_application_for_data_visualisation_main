<template>
  <header class="app-header">
    <div class="header-left">
      <router-link :to="{ name: 'home' }" class="brand home-link">
        <div class="logo">DV</div>
        <div class="title">DataViz</div>
      </router-link>

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
  </header>
</template>

<script>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useProjectsStore } from '../stores/projects'
import { useNotifications } from '../composables/useNotifications'
import { extractApiErrorMessage } from '../utils/api/errors'

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
    const profileWrap = ref(null)
    const projectsWrap = ref(null)

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
      const value = (authStore.user?.name || 'User').trim()
      if (!value) return 'U'

      const parts = value.split(/\s+/).filter(Boolean)
      const first = parts[0]?.[0] || ''
      const second = parts[1]?.[0] || ''
      return (first + second).toUpperCase()
    })

    const closeMenu = () => {
      menuOpen.value = false
    }

    const closeProjectsMenu = () => {
      projectsMenuOpen.value = false
    }

    const loadProjects = async () => {
      if (!authStore.isAuthenticated || projectsStore.loading) return
      try {
        await projectsStore.fetchProjects()
      } catch (_) {}
    }

    const toggleProjectsMenu = async () => {
      const willOpen = !projectsMenuOpen.value
      projectsMenuOpen.value = willOpen
      if (!willOpen) return
      closeMenu()
      await loadProjects()
    }

    const toggleMenu = () => {
      menuOpen.value = !menuOpen.value
      if (menuOpen.value) closeProjectsMenu()
    }

    const handleOutsideClick = (event) => {
      const insideProfile = profileWrap.value?.contains(event.target)
      const insideProjects = projectsWrap.value?.contains(event.target)
      if (!insideProfile) {
        closeMenu()
      }
      if (!insideProjects) {
        closeProjectsMenu()
      }
    }

    const handleKeydown = (event) => {
      if (event.key === 'Escape') {
        closeMenu()
        closeProjectsMenu()
      }
    }

    const handleLogout = async () => {
      try {
        await authStore.logout()
        closeMenu()
        closeProjectsMenu()
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
    })

    return {
      authStore,
      projectsStore,
      menuOpen,
      projectsMenuOpen,
      profileWrap,
      projectsWrap,
      showGuestLogin,
      isAdmin,
      isProjectsRoute,
      quickProjects,
      displayName,
      avatarUrl,
      initials,
      closeMenu,
      closeProjectsMenu,
      toggleProjectsMenu,
      toggleMenu,
      handleLogout,
      projectTitle,
    }
  },
}
</script>

<style scoped>
.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.home-link {
  text-decoration: none;
  color: inherit;
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

.header-right {
  margin-left: auto;
  position: relative;
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

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.18s cubic-bezier(0.2, 0.9, 0.3, 1);
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.98);
}

@media (max-width: 720px) {
  .title {
    font-size: 18px;
  }

  .nav-btn {
    padding: 6px 8px;
    font-size: 12px;
  }

  .profile-name {
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .projects-menu {
    width: min(280px, 86vw);
  }
}
</style>
