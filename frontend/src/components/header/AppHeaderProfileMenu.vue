<template>
  <div class="header-right" :ref="setProfileWrapRef">
    <router-link v-if="showGuestLogin" :to="{ name: 'login' }" class="btn">
      {{ t('nav.login') }}
    </router-link>

    <template v-else-if="isAuthenticated">
      <button
        class="profile-trigger"
        type="button"
        :aria-expanded="menuOpen.toString()"
        aria-haspopup="menu"
        @click="$emit('toggle-menu')"
      >
        <span class="profile-name">{{ displayName }}</span>
        <img
          v-if="avatarUrl"
          :src="avatarUrl"
          :alt="t('nav.avatarAlt')"
          class="avatar"
        />
        <div v-else class="avatar avatar-fallback">{{ initials }}</div>
      </button>

      <transition name="fade-slide">
        <div v-if="menuOpen" class="profile-menu" role="menu">
          <router-link :to="{ name: 'projects' }" class="menu-item" @click="$emit('close-menu')">
            <span class="menu-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none"><path d="M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z" stroke="currentColor" stroke-width="1.8"/></svg>
            </span>
            {{ t('nav.projects') }}
          </router-link>
          <router-link :to="{ name: 'profile' }" class="menu-item" @click="$emit('close-menu')">
            <span class="menu-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none"><path d="M12 12a4 4 0 1 0-0.001-8.001A4 4 0 0 0 12 12zm0 2c-4.2 0-7 2.1-7 5v1h14v-1c0-2.9-2.8-5-7-5z" stroke="currentColor" stroke-width="1.8"/></svg>
            </span>
            {{ t('nav.profile') }}
          </router-link>
          <div class="menu-divider"></div>
          <button class="menu-item menu-danger" type="button" @click="$emit('logout')">
            <span class="menu-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none"><path d="M14 7V4h6v16h-6v-3M10 12h10M10 12l3-3M10 12l3 3M4 4h6v4H8v8h2v4H4z" stroke="currentColor" stroke-width="1.8"/></svg>
            </span>
            {{ t('nav.logout') }}
          </button>
        </div>
      </transition>
    </template>
  </div>
</template>

<script>
import { useI18n } from 'vue-i18n'

export default {
  name: 'AppHeaderProfileMenu',
  props: {
    showGuestLogin: { type: Boolean, default: false },
    isAuthenticated: { type: Boolean, default: false },
    menuOpen: { type: Boolean, default: false },
    displayName: { type: String, default: '' },
    avatarUrl: { type: String, default: null },
    initials: { type: String, default: '' },
    setProfileWrapRef: { type: Function, default: null },
  },
  emits: ['toggle-menu', 'close-menu', 'logout'],
  setup() {
    const { t } = useI18n({ useScope: 'global' })

    return {
      t,
    }
  },
}
</script>

<style scoped>
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
  display: flex;
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

@media (max-width: 860px) {
  .profile-name {
    max-width: 120px;
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
}
</style>
