<template>
  <div class="admin-page app-content">
    <AdminStatsSection
      :loading="loadingStats"
      :error="statsError"
      :cards="statsCards"
      :refresh-disabled="refreshDisabled"
      @refresh="reloadAll"
    />

    <AdminUsersSection
      :users="users"
      :search="search"
      :loading="loadingUsers"
      :error="usersError"
      :selected-user-id="selectedUserId"
      :deleting-user-id="deletingUserId"
      :current-user-id="currentUserId"
      @update:search="search = $event"
      @search="loadUsers"
      @clear="clearSearch"
      @select-user="selectUser"
      @edit-user="openUserModal"
      @delete-user="handleDeleteUser"
    />

    <AdminProjectsSection
      :selected-user="selectedUser"
      :deleting-project-id="deletingProjectId"
      @create-project="openCreateProjectModal"
      @edit-project="openEditProjectModal"
      @delete-project="handleDeleteProject"
    />

    <AdminUserModal
      :is-open="showUserModal"
      :form="userForm"
      :error="userFormError"
      :saving="savingUser"
      :current-user-id="currentUserId"
      @update:form="updateUserForm"
      @close="closeUserModal"
      @save="handleSaveUser"
    />

    <AdminProjectModal
      :is-open="showProjectModal"
      :form="projectForm"
      :error="projectFormError"
      :saving="savingProject"
      @update:form="updateProjectForm"
      @close="closeProjectModal"
      @save="handleSaveProject"
    />
  </div>
</template>

<script>
import {
  AdminProjectModal,
  AdminProjectsSection,
  AdminStatsSection,
  AdminUserModal,
  AdminUsersSection,
} from '../components/admin'
import { useAdminPage } from '../composables/admin'

export default {
  name: 'AdminPage',
  components: {
    AdminStatsSection,
    AdminUsersSection,
    AdminProjectsSection,
    AdminUserModal,
    AdminProjectModal,
  },
  setup() {
    return useAdminPage()
  },
}
</script>

<style scoped>
.admin-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
</style>
