import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { useAdminProjects } from './useAdminProjects'
import { useAdminStats } from './useAdminStats'
import { useAdminUsers } from './useAdminUsers'

export const useAdminPage = () => {
  const router = useRouter()
  const authStore = useAuthStore()

  const statsState = useAdminStats()
  const usersState = useAdminUsers({
    authStore,
    onStatsRefresh: statsState.loadStats,
  })
  const projectsState = useAdminProjects({
    selectedUser: usersState.selectedUser,
    updateUserById: usersState.updateUserById,
    onStatsRefresh: statsState.loadStats,
  })

  const refreshDisabled = computed(() => (
    statsState.loadingStats.value || usersState.loadingUsers.value
  ))

  const reloadAll = async () => {
    await Promise.all([statsState.loadStats(), usersState.loadUsers()])
  }

  onMounted(async () => {
    if (!authStore.user) {
      try {
        await authStore.fetchUser()
      } catch (_) {
        await router.push({ name: 'login' })
        return
      }
    }

    if (!authStore.isAdmin) {
      await router.push({ name: 'home' })
      return
    }

    await reloadAll()
  })

  return {
    ...statsState,
    ...usersState,
    ...projectsState,
    refreshDisabled,
    reloadAll,
  }
}
