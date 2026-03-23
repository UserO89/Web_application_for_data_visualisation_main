import { computed, ref } from 'vue'
import { adminApi } from '../../api/admin'
import { extractAdminApiError } from '../../utils/admin'

const EMPTY_STATS = {
  users_total: 0,
  projects_total: 0,
  datasets_total: 0,
  dataset_rows_total: 0,
  new_users_7d: 0,
  new_projects_7d: 0,
  active_sessions_24h: 0,
}

export const useAdminStats = () => {
  const loadingStats = ref(false)
  const statsError = ref('')
  const stats = ref({ ...EMPTY_STATS })

  const statsCards = computed(() => [
    { key: 'users_total', label: 'Users total', value: stats.value.users_total ?? 0 },
    { key: 'projects_total', label: 'Projects total', value: stats.value.projects_total ?? 0 },
    { key: 'datasets_total', label: 'Datasets total', value: stats.value.datasets_total ?? 0 },
    { key: 'dataset_rows_total', label: 'Rows total', value: stats.value.dataset_rows_total ?? 0 },
    { key: 'new_users_7d', label: 'New users (7d)', value: stats.value.new_users_7d ?? 0 },
    { key: 'new_projects_7d', label: 'New projects (7d)', value: stats.value.new_projects_7d ?? 0 },
    { key: 'active_sessions_24h', label: 'Active sessions (24h)', value: stats.value.active_sessions_24h ?? 0 },
  ])

  const loadStats = async () => {
    loadingStats.value = true
    statsError.value = ''
    try {
      const response = await adminApi.getStats()
      stats.value = {
        ...stats.value,
        ...(response?.stats || {}),
      }
    } catch (error) {
      statsError.value = extractAdminApiError(error, 'Failed to load statistics.')
    } finally {
      loadingStats.value = false
    }
  }

  return {
    loadingStats,
    statsError,
    statsCards,
    loadStats,
  }
}
