import { useNotifications } from '../../src/composables/useNotifications'

describe('useNotifications', () => {
  const notifications = useNotifications()

  beforeEach(() => {
    vi.useFakeTimers()
    notifications.clear()
  })

  afterEach(() => {
    notifications.clear()
    vi.useRealTimers()
  })

  it('adds and removes notifications manually', () => {
    const id = notifications.success('Saved successfully.', { duration: 0 })

    expect(id).toBeTypeOf('number')
    expect(notifications.notifications.value).toHaveLength(1)
    expect(notifications.notifications.value[0].type).toBe('success')

    notifications.remove(id)
    expect(notifications.notifications.value).toHaveLength(0)
  })

  it('auto dismisses notifications when duration is set', () => {
    notifications.error('Failed to save chart.', { duration: 1000 })
    expect(notifications.notifications.value).toHaveLength(1)

    vi.advanceTimersByTime(1000)
    expect(notifications.notifications.value).toHaveLength(0)
  })

  it('does not create notification when message is empty', () => {
    const id = notifications.info('   ')

    expect(id).toBeNull()
    expect(notifications.notifications.value).toHaveLength(0)
  })
})
