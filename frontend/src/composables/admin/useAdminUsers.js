import { computed, ref } from 'vue'
import { adminApi } from '../../api/admin'
import { translate } from '../../i18n'
import { extractAdminApiError } from '../../utils/admin'
import { useNotifications } from '../useNotifications'

const createInitialUserForm = () => ({
  id: null,
  name: '',
  email: '',
  role: 'user',
  password: '',
})

const normalizeUsers = (items) => (
  Array.isArray(items)
    ? items.map((user) => ({
      ...user,
      projects: Array.isArray(user.projects) ? user.projects : [],
    }))
    : []
)

export const useAdminUsers = ({ authStore, onStatsRefresh }) => {
  const notify = useNotifications()
  const loadingUsers = ref(false)
  const usersError = ref('')
  const users = ref([])
  const search = ref('')
  const selectedUserId = ref(null)

  const showUserModal = ref(false)
  const savingUser = ref(false)
  const deletingUserId = ref(null)
  const userFormError = ref('')
  const userForm = ref(createInitialUserForm())

  const currentUserId = computed(() => authStore.user?.id ?? null)
  const selectedUser = computed(() => (
    users.value.find((user) => user.id === selectedUserId.value) || null
  ))

  const isCurrentUser = (user) => user?.id === currentUserId.value

  const loadUsers = async () => {
    loadingUsers.value = true
    usersError.value = ''
    try {
      const response = await adminApi.listUsers(search.value.trim())
      users.value = normalizeUsers(response?.users)

      if (!users.value.some((user) => user.id === selectedUserId.value)) {
        selectedUserId.value = null
      }
    } catch (error) {
      usersError.value = extractAdminApiError(error, translate('admin.users.loadFailed'))
    } finally {
      loadingUsers.value = false
    }
  }

  const clearSearch = async () => {
    search.value = ''
    await loadUsers()
  }

  const selectUser = (user) => {
    selectedUserId.value = user?.id ?? null
  }

  const updateUserById = (userId, updater) => {
    users.value = users.value.map((user) => {
      if (user.id !== userId) return user
      return updater(user)
    })
  }

  const removeUserById = (userId) => {
    users.value = users.value.filter((user) => user.id !== userId)
  }

  const updateUserInList = (updatedUser) => {
    if (!updatedUser?.id) return

    updateUserById(updatedUser.id, (user) => ({
      ...user,
      ...updatedUser,
      projects: Array.isArray(updatedUser.projects) ? updatedUser.projects : (user.projects || []),
      projects_count: updatedUser.projects_count
        ?? (Array.isArray(updatedUser.projects) ? updatedUser.projects.length : (user.projects_count ?? 0)),
    }))
  }

  const openUserModal = (user) => {
    userForm.value = {
      id: user.id,
      name: user.name || '',
      email: user.email || '',
      role: user.role || 'user',
      password: '',
    }
    userFormError.value = ''
    showUserModal.value = true
  }

  const closeUserModal = () => {
    showUserModal.value = false
    userFormError.value = ''
  }

  const updateUserForm = (nextForm) => {
    userForm.value = {
      ...userForm.value,
      ...(nextForm || {}),
    }
  }

  const handleSaveUser = async () => {
    const payload = {
      name: (userForm.value.name || '').trim(),
      email: (userForm.value.email || '').trim(),
      role: userForm.value.role,
    }

    if (!payload.name || !payload.email) {
      userFormError.value = translate('admin.users.requiredFields')
      return
    }

    const newPassword = (userForm.value.password || '').trim()
    if (newPassword) {
      payload.password = newPassword
    }

    if (isCurrentUser({ id: userForm.value.id })) {
      payload.role = authStore.user.role
    }

    userFormError.value = ''
    savingUser.value = true
    try {
      const response = await adminApi.updateUser(userForm.value.id, payload)
      const updatedUser = response?.user
      updateUserInList(updatedUser)

      if (updatedUser?.id === currentUserId.value) {
        authStore.user = {
          ...authStore.user,
          ...updatedUser,
        }
      }

      closeUserModal()
      notify.success(translate('admin.users.updated'))
    } catch (error) {
      userFormError.value = extractAdminApiError(error, translate('admin.users.updateFailed'))
    } finally {
      savingUser.value = false
    }
  }

  const handleDeleteUser = async (user) => {
    if (!user?.id || isCurrentUser(user)) return

    const confirmed = window.confirm(translate('admin.users.deleteConfirm', { name: user.name }))
    if (!confirmed) return

    deletingUserId.value = user.id
    try {
      await adminApi.deleteUser(user.id)
      removeUserById(user.id)
      if (selectedUserId.value === user.id) {
        selectedUserId.value = null
      }
      await onStatsRefresh()
      notify.success(translate('admin.users.deleted'))
    } catch (error) {
      notify.error(extractAdminApiError(error, translate('admin.users.deleteFailed')))
    } finally {
      deletingUserId.value = null
    }
  }

  return {
    loadingUsers,
    usersError,
    users,
    search,
    selectedUserId,
    selectedUser,
    currentUserId,
    showUserModal,
    savingUser,
    deletingUserId,
    userFormError,
    userForm,
    updateUserById,
    loadUsers,
    clearSearch,
    selectUser,
    openUserModal,
    closeUserModal,
    updateUserForm,
    handleSaveUser,
    handleDeleteUser,
  }
}
