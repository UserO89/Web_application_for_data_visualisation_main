<template>
  <div class="desktop-nav-group">
    <router-link :to="{ name: 'home' }" class="nav-btn">{{ t('nav.home') }}</router-link>

    <div v-if="isAuthenticated" class="projects-nav" :ref="setProjectsWrapRef">
      <button
        class="nav-btn nav-dropdown"
        type="button"
        :class="{ active: isProjectsRoute }"
        :aria-expanded="projectsMenuOpen.toString()"
        aria-haspopup="menu"
        @click="$emit('toggle-projects-menu')"
      >
        <span>{{ t('nav.projects') }}</span>
        <span class="dropdown-chevron" :class="{ open: projectsMenuOpen }" aria-hidden="true">
          <svg viewBox="0 0 16 16" fill="none">
            <path d="M3 6l5 5 5-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
      </button>

      <transition name="fade-slide">
        <div v-if="projectsMenuOpen" class="projects-menu" role="menu">
          <router-link :to="{ name: 'projects' }" class="projects-item projects-all" @click="$emit('close-projects-menu')">
            {{ t('nav.openProjects') }}
          </router-link>
          <div class="projects-divider"></div>

          <div v-if="projectsLoading && !quickProjects.length" class="projects-empty">
            {{ t('nav.loadingProjects') }}
          </div>
          <template v-else-if="quickProjects.length">
            <router-link
              v-for="project in quickProjects"
              :key="`quick-project-${project.id}`"
              :to="{ name: 'project', params: { id: project.id } }"
              class="projects-item"
              @click="$emit('close-projects-menu')"
            >
              <span class="projects-item-title">{{ projectTitle(project) }}</span>
            </router-link>
          </template>
          <div v-else class="projects-empty">{{ t('nav.noProjects') }}</div>
        </div>
      </transition>
    </div>

    <router-link v-if="isAdmin" :to="{ name: 'admin' }" class="nav-btn">{{ t('nav.admin') }}</router-link>
  </div>
</template>

<script>
import { useI18n } from 'vue-i18n'

export default {
  name: 'AppHeaderDesktopNav',
  props: {
    isAuthenticated: { type: Boolean, default: false },
    isAdmin: { type: Boolean, default: false },
    isProjectsRoute: { type: Boolean, default: false },
    projectsMenuOpen: { type: Boolean, default: false },
    projectsLoading: { type: Boolean, default: false },
    quickProjects: { type: Array, default: () => [] },
    projectTitle: { type: Function, required: true },
    setProjectsWrapRef: { type: Function, default: null },
  },
  emits: ['toggle-projects-menu', 'close-projects-menu'],
  setup() {
    const { t } = useI18n({ useScope: 'global' })

    return {
      t,
    }
  },
}
</script>

<style scoped>
.desktop-nav-group {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
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

  .projects-menu {
    width: min(320px, 92vw);
  }
}
</style>
