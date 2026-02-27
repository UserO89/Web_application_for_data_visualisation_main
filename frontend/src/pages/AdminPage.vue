<template>
  <div class="admin-page app-content">
    <section class="panel">
      <div class="section-head">
        <div>
          <div class="section-title">Admin Panel</div>
          <div class="section-subtitle">Statistics and user management</div>
        </div>
        <button class="btn" type="button" @click="reloadAll" :disabled="loadingStats || loadingUsers">
          Refresh
        </button>
      </div>

      <div v-if="statsError" class="error-text">{{ statsError }}</div>
      <div v-if="loadingStats" class="loading">Loading statistics...</div>
      <div v-else class="stats-grid">
        <div v-for="card in statsCards" :key="card.key" class="stat-card">
          <div class="stat-title">{{ card.label }}</div>
          <div class="stat-value">{{ card.value }}</div>
        </div>
      </div>
    </section>

    <section class="panel">
      <div class="section-head">
        <div>
          <div class="section-title">Users</div>
          <div class="section-subtitle">
            Select a user to manage projects. Until selection, project list stays hidden.
          </div>
        </div>
      </div>

      <form class="search-row" @submit.prevent="loadUsers">
        <input
          v-model="search"
          type="text"
          placeholder="Search by name or email"
        />
        <button class="btn" type="submit">Search</button>
        <button v-if="search" class="btn" type="button" @click="clearSearch">Clear</button>
      </form>

      <div v-if="usersError" class="error-text">{{ usersError }}</div>
      <div v-if="loadingUsers" class="loading">Loading users...</div>
      <div v-else-if="users.length === 0" class="empty-state">No users found.</div>
      <div v-else class="user-list">
        <article
          v-for="user in users"
          :key="user.id"
          :class="['user-card', { selected: selectedUserId === user.id }]"
        >
          <div class="user-row">
            <div class="identity">
              <img
                v-if="user.avatar_url"
                :src="user.avatar_url"
                alt="avatar"
                class="user-avatar"
              />
              <div v-else class="user-avatar user-avatar-fallback">{{ initials(user.name) }}</div>
              <div>
                <div class="user-name">{{ user.name }}</div>
                <div class="user-meta">
                  {{ user.email }} - joined {{ formatDate(user.created_at) }} -
                  {{ user.projects_count ?? user.projects.length }} projects
                </div>
              </div>
            </div>

            <div class="user-actions">
              <span :class="['badge', user.role === 'admin' ? 'badge-admin' : 'badge-user']">
                {{ user.role }}
              </span>
              <button
                type="button"
                :class="['btn', selectedUserId === user.id ? 'primary' : '']"
                @click="selectUser(user)"
              >
                {{ selectedUserId === user.id ? 'Selected' : 'Select' }}
              </button>
              <button class="btn" type="button" @click="openUserModal(user)">Edit user</button>
              <button
                class="btn danger"
                type="button"
                @click="handleDeleteUser(user)"
                :disabled="deletingUserId === user.id || isCurrentUser(user)"
              >
                {{ deletingUserId === user.id ? 'Deleting...' : 'Delete user' }}
              </button>
            </div>
          </div>
        </article>
      </div>
    </section>

    <section class="panel">
      <div class="section-head">
        <div>
          <div class="section-title">Projects</div>
          <div class="section-subtitle" v-if="selectedUser">
            Managing projects of <strong>{{ selectedUser.name }}</strong>
          </div>
          <div class="section-subtitle" v-else>
            Select a user to view available projects.
          </div>
        </div>
        <button
          class="btn primary"
          type="button"
          @click="openCreateProjectModal"
          :disabled="!selectedUser"
        >
          + New Project
        </button>
      </div>

      <div v-if="!selectedUser" class="empty-state">
        Projects are hidden until you select a user above.
      </div>
      <div v-else-if="!selectedUser.projects?.length" class="empty-state">
        This user has no projects yet.
      </div>
      <div v-else class="project-list">
        <div v-for="project in selectedUser.projects" :key="project.id" class="project-row">
          <div class="project-info">
            <div class="project-title">{{ project.title }}</div>
            <div class="project-meta">
              {{ project.description || 'No description' }}
            </div>
          </div>
          <div class="project-actions">
            <button class="btn" type="button" @click="openEditProjectModal(project)">Edit</button>
            <button
              class="btn danger"
              type="button"
              @click="handleDeleteProject(project)"
              :disabled="deletingProjectId === project.id"
            >
              {{ deletingProjectId === project.id ? 'Deleting...' : 'Delete' }}
            </button>
          </div>
        </div>
      </div>
    </section>

    <div v-if="showUserModal" class="modal-overlay" @click="closeUserModal">
      <div class="modal panel" @click.stop>
        <h2 style="margin-bottom: 14px; font-size: 18px;">Edit User</h2>
        <form @submit.prevent="handleSaveUser">
          <div class="form-group">
            <label>Name</label>
            <input v-model="userForm.name" type="text" required maxlength="120" />
          </div>
          <div class="form-group">
            <label>Email</label>
            <input v-model="userForm.email" type="email" required maxlength="190" />
          </div>
          <div class="form-group">
            <label>Role</label>
            <select v-model="userForm.role" :disabled="userForm.id === authStore.user?.id">
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>
          </div>
          <div class="form-group">
            <label>New password (optional)</label>
            <input v-model="userForm.password" type="password" minlength="8" />
          </div>

          <div v-if="userFormError" class="error-text">{{ userFormError }}</div>

          <div class="modal-actions">
            <button class="btn" type="button" @click="closeUserModal">Cancel</button>
            <button class="btn primary" type="submit" :disabled="savingUser">
              {{ savingUser ? 'Saving...' : 'Save' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="showProjectModal" class="modal-overlay" @click="closeProjectModal">
      <div class="modal panel" @click.stop>
        <h2 style="margin-bottom: 14px; font-size: 18px;">
          {{ projectForm.mode === 'create' ? 'Create Project' : 'Edit Project' }}
        </h2>
        <form @submit.prevent="handleSaveProject">
          <div class="form-group">
            <label>Title</label>
            <input v-model="projectForm.title" type="text" required maxlength="255" />
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea v-model="projectForm.description" rows="3" maxlength="1000"></textarea>
          </div>

          <div v-if="projectFormError" class="error-text">{{ projectFormError }}</div>

          <div class="modal-actions">
            <button class="btn" type="button" @click="closeProjectModal">Cancel</button>
            <button class="btn primary" type="submit" :disabled="savingProject">
              {{ savingProject ? 'Saving...' : (projectForm.mode === 'create' ? 'Create' : 'Save') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { adminApi } from '../api/admin'
import { useAuthStore } from '../stores/auth'

export default {
  name: 'AdminPage',
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()

    const loadingStats = ref(false)
    const loadingUsers = ref(false)
    const statsError = ref('')
    const usersError = ref('')
    const stats = ref({
      users_total: 0,
      projects_total: 0,
      datasets_total: 0,
      dataset_rows_total: 0,
      new_users_7d: 0,
      new_projects_7d: 0,
      active_sessions_24h: 0,
    })
    const users = ref([])
    const search = ref('')
    const selectedUserId = ref(null)

    const showUserModal = ref(false)
    const showProjectModal = ref(false)
    const savingUser = ref(false)
    const savingProject = ref(false)
    const deletingUserId = ref(null)
    const deletingProjectId = ref(null)
    const userFormError = ref('')
    const projectFormError = ref('')
    const userForm = ref({
      id: null,
      name: '',
      email: '',
      role: 'user',
      password: '',
    })
    const projectForm = ref({
      mode: 'create',
      userId: null,
      id: null,
      title: '',
      description: '',
    })

    const selectedUser = computed(() => {
      return users.value.find((user) => user.id === selectedUserId.value) || null
    })

    const statsCards = computed(() => [
      { key: 'users_total', label: 'Users total', value: stats.value.users_total ?? 0 },
      { key: 'projects_total', label: 'Projects total', value: stats.value.projects_total ?? 0 },
      { key: 'datasets_total', label: 'Datasets total', value: stats.value.datasets_total ?? 0 },
      { key: 'dataset_rows_total', label: 'Rows total', value: stats.value.dataset_rows_total ?? 0 },
      { key: 'new_users_7d', label: 'New users (7d)', value: stats.value.new_users_7d ?? 0 },
      { key: 'new_projects_7d', label: 'New projects (7d)', value: stats.value.new_projects_7d ?? 0 },
      { key: 'active_sessions_24h', label: 'Active sessions (24h)', value: stats.value.active_sessions_24h ?? 0 },
    ])

    const extractError = (error, fallback = 'Request failed.') => {
      const apiData = error?.response?.data
      if (apiData?.message) return apiData.message
      if (apiData?.errors) return Object.values(apiData.errors).flat().join(' ')
      return fallback
    }

    const initials = (name) => {
      const value = (name || 'User').trim()
      if (!value) return 'U'
      const parts = value.split(/\s+/).filter(Boolean)
      const first = parts[0]?.[0] || ''
      const second = parts[1]?.[0] || ''
      return (first + second).toUpperCase()
    }

    const formatDate = (value) => {
      if (!value) return '-'
      const date = new Date(value)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    }

    const isCurrentUser = (user) => {
      return user.id === authStore.user?.id
    }

    const loadStats = async () => {
      loadingStats.value = true
      statsError.value = ''
      try {
        const response = await adminApi.getStats()
        stats.value = {
          ...stats.value,
          ...(response.stats || {}),
        }
      } catch (error) {
        statsError.value = extractError(error, 'Failed to load statistics.')
      } finally {
        loadingStats.value = false
      }
    }

    const loadUsers = async () => {
      loadingUsers.value = true
      usersError.value = ''
      try {
        const response = await adminApi.listUsers(search.value.trim())
        users.value = (response.users || []).map((user) => ({
          ...user,
          projects: user.projects || [],
        }))

        if (!users.value.some((user) => user.id === selectedUserId.value)) {
          selectedUserId.value = null
        }
      } catch (error) {
        usersError.value = extractError(error, 'Failed to load users.')
      } finally {
        loadingUsers.value = false
      }
    }

    const reloadAll = async () => {
      await Promise.all([loadStats(), loadUsers()])
    }

    const clearSearch = async () => {
      search.value = ''
      await loadUsers()
    }

    const selectUser = (user) => {
      selectedUserId.value = user.id
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

    const updateUserInList = (updatedUser) => {
      users.value = users.value.map((user) => {
        if (user.id !== updatedUser.id) return user
        return {
          ...user,
          ...updatedUser,
          projects: updatedUser.projects || user.projects || [],
          projects_count: updatedUser.projects_count ?? (updatedUser.projects?.length ?? user.projects_count ?? 0),
        }
      })
    }

    const handleSaveUser = async () => {
      const payload = {
        name: (userForm.value.name || '').trim(),
        email: (userForm.value.email || '').trim(),
        role: userForm.value.role,
      }

      if (!payload.name || !payload.email) {
        userFormError.value = 'Name and email are required.'
        return
      }

      const newPassword = (userForm.value.password || '').trim()
      if (newPassword) {
        payload.password = newPassword
      }

      if (userForm.value.id === authStore.user?.id) {
        payload.role = authStore.user.role
      }

      userFormError.value = ''
      savingUser.value = true
      try {
        const response = await adminApi.updateUser(userForm.value.id, payload)
        const updatedUser = response.user
        updateUserInList(updatedUser)

        if (updatedUser?.id === authStore.user?.id) {
          authStore.user = {
            ...authStore.user,
            ...updatedUser,
          }
        }

        closeUserModal()
      } catch (error) {
        userFormError.value = extractError(error, 'Failed to update user.')
      } finally {
        savingUser.value = false
      }
    }

    const handleDeleteUser = async (user) => {
      if (isCurrentUser(user)) return

      const confirmed = window.confirm(`Delete user "${user.name}" and all related projects?`)
      if (!confirmed) return

      deletingUserId.value = user.id
      try {
        await adminApi.deleteUser(user.id)
        users.value = users.value.filter((item) => item.id !== user.id)
        if (selectedUserId.value === user.id) {
          selectedUserId.value = null
        }
        await loadStats()
      } catch (error) {
        window.alert(extractError(error, 'Failed to delete user.'))
      } finally {
        deletingUserId.value = null
      }
    }

    const openCreateProjectModal = () => {
      if (!selectedUser.value) return
      projectForm.value = {
        mode: 'create',
        userId: selectedUser.value.id,
        id: null,
        title: '',
        description: '',
      }
      projectFormError.value = ''
      showProjectModal.value = true
    }

    const openEditProjectModal = (project) => {
      if (!selectedUser.value) return
      projectForm.value = {
        mode: 'edit',
        userId: selectedUser.value.id,
        id: project.id,
        title: project.title || '',
        description: project.description || '',
      }
      projectFormError.value = ''
      showProjectModal.value = true
    }

    const closeProjectModal = () => {
      showProjectModal.value = false
      projectFormError.value = ''
    }

    const handleSaveProject = async () => {
      const payload = {
        title: (projectForm.value.title || '').trim(),
        description: (projectForm.value.description || '').trim(),
      }

      if (!payload.title) {
        projectFormError.value = 'Project title is required.'
        return
      }

      savingProject.value = true
      projectFormError.value = ''

      try {
        if (projectForm.value.mode === 'create') {
          const created = await adminApi.createUserProject(projectForm.value.userId, payload)
          const createdProject = created.project

          users.value = users.value.map((user) => {
            if (user.id !== projectForm.value.userId) return user
            return {
              ...user,
              projects: [createdProject, ...(user.projects || [])],
              projects_count: (user.projects_count ?? user.projects.length ?? 0) + 1,
            }
          })
        } else {
          const updated = await adminApi.updateUserProject(
            projectForm.value.userId,
            projectForm.value.id,
            payload
          )
          const updatedProject = updated.project

          users.value = users.value.map((user) => {
            if (user.id !== projectForm.value.userId) return user
            return {
              ...user,
              projects: (user.projects || []).map((project) =>
                project.id === updatedProject.id ? { ...project, ...updatedProject } : project
              ),
            }
          })
        }

        closeProjectModal()
        await loadStats()
      } catch (error) {
        projectFormError.value = extractError(error, 'Failed to save project.')
      } finally {
        savingProject.value = false
      }
    }

    const handleDeleteProject = async (project) => {
      if (!selectedUser.value) return

      const confirmed = window.confirm(`Delete project "${project.title}"?`)
      if (!confirmed) return

      deletingProjectId.value = project.id
      try {
        await adminApi.deleteUserProject(selectedUser.value.id, project.id)
        users.value = users.value.map((user) => {
          if (user.id !== selectedUser.value.id) return user
          const nextProjects = (user.projects || []).filter((entry) => entry.id !== project.id)
          return {
            ...user,
            projects: nextProjects,
            projects_count: Math.max(0, (user.projects_count ?? nextProjects.length) - 1),
          }
        })
        await loadStats()
      } catch (error) {
        window.alert(extractError(error, 'Failed to delete project.'))
      } finally {
        deletingProjectId.value = null
      }
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
      authStore,
      loadingStats,
      loadingUsers,
      statsError,
      usersError,
      statsCards,
      users,
      search,
      selectedUserId,
      selectedUser,
      showUserModal,
      showProjectModal,
      savingUser,
      savingProject,
      deletingUserId,
      deletingProjectId,
      userFormError,
      projectFormError,
      userForm,
      projectForm,
      initials,
      formatDate,
      isCurrentUser,
      loadUsers,
      reloadAll,
      clearSearch,
      selectUser,
      openUserModal,
      closeUserModal,
      handleSaveUser,
      handleDeleteUser,
      openCreateProjectModal,
      openEditProjectModal,
      closeProjectModal,
      handleSaveProject,
      handleDeleteProject,
    }
  },
}
</script>

<style scoped>
.admin-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 14px;
}

.section-title {
  font-size: 20px;
  font-weight: 700;
}

.section-subtitle {
  color: var(--muted);
  font-size: 13px;
  margin-top: 4px;
  line-height: 1.45;
}

.section-subtitle strong {
  color: var(--text);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.search-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

.search-row input {
  flex: 1;
  min-width: 240px;
  padding: 0.75rem;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface);
  color: var(--text);
}

.search-row input:focus {
  outline: none;
  border-color: var(--accent);
}

.loading,
.empty-state {
  color: var(--muted);
  text-align: center;
  padding: 20px;
}

.error-text {
  color: #ff9b9b;
  font-size: 13px;
  margin-bottom: 10px;
}

.user-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.user-card {
  border: 1px solid var(--border);
  border-radius: 12px;
  background: #1a1a1a;
  overflow: hidden;
}

.user-card.selected {
  border-color: rgba(29, 185, 84, 0.45);
  box-shadow: inset 0 0 0 1px rgba(29, 185, 84, 0.2);
}

.user-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 12px;
}

.identity {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 999px;
  object-fit: cover;
  border: 1px solid var(--border);
}

.user-avatar-fallback {
  display: grid;
  place-items: center;
  background: #2a2a2a;
  color: var(--text);
  font-size: 12px;
  font-weight: 700;
}

.user-name {
  font-size: 15px;
  font-weight: 700;
}

.user-meta {
  color: var(--muted);
  font-size: 12px;
  margin-top: 2px;
}

.user-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.badge {
  border-radius: 999px;
  padding: 5px 9px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.badge-admin {
  background: rgba(29, 185, 84, 0.2);
  color: #7ee2a0;
  border: 1px solid rgba(29, 185, 84, 0.35);
}

.badge-user {
  background: #2a2a2a;
  color: var(--muted);
  border: 1px solid var(--border);
}

.project-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.project-row {
  border: 1px solid var(--border);
  border-radius: 10px;
  background: #202020;
  padding: 10px;
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
}

.project-info {
  min-width: 0;
}

.project-title {
  font-size: 14px;
  font-weight: 700;
}

.project-meta {
  margin-top: 4px;
  color: var(--muted);
  font-size: 12px;
}

.project-actions {
  display: flex;
  gap: 8px;
}

.btn.danger {
  color: #ff9b9b;
}

.btn.danger:hover {
  background: #382121;
  color: #ffc0c0;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  width: min(520px, 92%);
  max-height: 90vh;
  overflow-y: auto;
}

.modal select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface);
  color: var(--text);
  font-size: 14px;
}

.modal select:focus {
  outline: none;
  border-color: var(--accent);
}

.modal-actions {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

@media (max-width: 980px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 680px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .user-row,
  .project-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .user-actions,
  .project-actions {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
