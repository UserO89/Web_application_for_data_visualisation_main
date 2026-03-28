<template>
  <div class="toast-host" aria-live="polite" aria-relevant="additions text">
    <transition-group name="toast" tag="div" class="toast-list">
      <article
        v-for="toast in notifications"
        :key="toast.id"
        :class="['toast-item', `toast-${toast.type}`]"
        :role="toast.type === 'error' ? 'alert' : 'status'"
      >
        <div class="toast-text">
          <div class="toast-title">{{ toast.title || typeTitles[toast.type] || 'Notice' }}</div>
          <div class="toast-message">{{ toast.message }}</div>
        </div>
        <button class="toast-close" type="button" aria-label="Dismiss notification" @click="remove(toast.id)">
          x
        </button>
      </article>
    </transition-group>
  </div>
</template>

<script>
import { useNotifications } from '../composables/useNotifications'

const TYPE_TITLES = Object.freeze({
  success: 'Success',
  error: 'Error',
  info: 'Info',
  warning: 'Warning',
})

export default {
  name: 'NotificationToasts',
  setup() {
    const { notifications, remove } = useNotifications()

    return {
      notifications,
      remove,
      typeTitles: TYPE_TITLES,
    }
  },
}
</script>

<style scoped>
.toast-host {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 2200;
  pointer-events: none;
}

.toast-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.toast-item {
  width: min(360px, calc(100vw - 32px));
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  background: #1d1d1d;
  border: 1px solid var(--border);
  border-left-width: 4px;
  border-radius: 12px;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.35);
  padding: 10px 12px;
  pointer-events: auto;
}

.toast-success { border-left-color: #28b95b; }
.toast-error { border-left-color: #e05f5f; }
.toast-info { border-left-color: #63a4ff; }
.toast-warning { border-left-color: #f3b34c; }

.toast-text {
  min-width: 0;
}

.toast-title {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.01em;
  color: #ececec;
}

.toast-message {
  margin-top: 3px;
  color: #d6d6d6;
  font-size: 13px;
  line-height: 1.35;
  word-break: break-word;
}

.toast-close {
  border: none;
  background: transparent;
  color: var(--muted);
  font-size: 13px;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
  padding: 2px 3px;
  border-radius: 6px;
}

.toast-close:hover {
  color: var(--text);
  background: #2a2a2a;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.22s cubic-bezier(0.2, 0.9, 0.3, 1);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.98);
}

@media (max-width: 640px) {
  .toast-host {
    top: 10px;
    right: 10px;
    left: 10px;
  }

  .toast-item {
    width: 100%;
  }
}
</style>
