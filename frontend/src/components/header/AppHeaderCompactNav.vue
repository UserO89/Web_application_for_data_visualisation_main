<template>
  <transition name="fade-slide">
    <div
      v-if="open"
      id="compact-nav-accordion"
      class="compact-nav-accordion"
      :ref="setCompactNavPanelRef"
      @click.stop
    >
      <router-link :to="{ name: 'home' }" class="compact-nav-item" @click="$emit('close-compact-nav')">
        {{ t('nav.home') }}
      </router-link>

      <button
        v-if="isAuthenticated"
        class="compact-nav-item compact-projects-toggle"
        type="button"
        :aria-expanded="compactProjectsOpen.toString()"
        @click="$emit('toggle-compact-projects')"
      >
        <span>{{ t('nav.projects') }}</span>
        <span class="compact-chevron" :class="{ open: compactProjectsOpen }" aria-hidden="true">
          <svg viewBox="0 0 16 16" fill="none">
            <path d="M3 6l5 5 5-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
      </button>

      <div v-if="isAuthenticated && compactProjectsOpen" class="compact-projects-list">
        <router-link :to="{ name: 'projects' }" class="compact-project-item" @click="$emit('close-compact-nav')">
          {{ t('nav.openProjects') }}
        </router-link>
        <router-link
          v-for="project in quickProjects"
          :key="`compact-project-${project.id}`"
          :to="{ name: 'project', params: { id: project.id } }"
          class="compact-project-item"
          @click="$emit('close-compact-nav')"
        >
          {{ projectTitle(project) }}
        </router-link>
      </div>

      <router-link v-if="isAdmin" :to="{ name: 'admin' }" class="compact-nav-item" @click="$emit('close-compact-nav')">
        {{ t('nav.admin') }}
      </router-link>
    </div>
  </transition>
</template>

<script>
import { useI18n } from 'vue-i18n'

export default {
  name: 'AppHeaderCompactNav',
  props: {
    open: { type: Boolean, default: false },
    isAuthenticated: { type: Boolean, default: false },
    compactProjectsOpen: { type: Boolean, default: false },
    isAdmin: { type: Boolean, default: false },
    quickProjects: { type: Array, default: () => [] },
    projectTitle: { type: Function, required: true },
    setCompactNavPanelRef: { type: Function, default: null },
  },
  emits: ['close-compact-nav', 'toggle-compact-projects'],
  setup() {
    const { t } = useI18n({ useScope: 'global' })

    return {
      t,
    }
  },
}
</script>

<style scoped>
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
}

@media (max-width: 560px) {
  .compact-nav-accordion {
    padding: 8px;
  }
}
</style>
