import { readonly, ref } from 'vue'

const TYPE_DEFAULT_DURATION = Object.freeze({
  success: 2800,
  info: 3600,
  warning: 4200,
  error: 5200,
})

const notifications = ref([])
const dismissTimers = new Map()
let nextNotificationId = 1

const normalizeText = (value) => {
  const text = String(value ?? '').trim()
  return text || ''
}

const resolveDuration = (type, customDuration) => {
  const duration = Number(customDuration)
  if (Number.isFinite(duration) && duration >= 0) {
    return duration
  }
  return TYPE_DEFAULT_DURATION[type] ?? TYPE_DEFAULT_DURATION.info
}

const clearTimer = (id) => {
  const timer = dismissTimers.get(id)
  if (!timer) return
  clearTimeout(timer)
  dismissTimers.delete(id)
}

const remove = (id) => {
  clearTimer(id)
  notifications.value = notifications.value.filter((notification) => notification.id !== id)
}

const clear = () => {
  Array.from(dismissTimers.keys()).forEach((id) => clearTimer(id))
  notifications.value = []
}

const push = (type, message, options = {}) => {
  const normalizedMessage = normalizeText(message)
  if (!normalizedMessage) return null

  const notification = {
    id: nextNotificationId++,
    type,
    title: normalizeText(options.title),
    message: normalizedMessage,
    duration: resolveDuration(type, options.duration),
  }

  notifications.value = [...notifications.value, notification]

  if (notification.duration > 0) {
    const timer = setTimeout(() => {
      dismissTimers.delete(notification.id)
      notifications.value = notifications.value.filter((entry) => entry.id !== notification.id)
    }, notification.duration)
    dismissTimers.set(notification.id, timer)
  }

  return notification.id
}

export const useNotifications = () => ({
  notifications: readonly(notifications),
  notify(type, message, options = {}) {
    return push(type, message, options)
  },
  success(message, options = {}) {
    return push('success', message, options)
  },
  error(message, options = {}) {
    return push('error', message, options)
  },
  info(message, options = {}) {
    return push('info', message, options)
  },
  warning(message, options = {}) {
    return push('warning', message, options)
  },
  remove,
  clear,
})
