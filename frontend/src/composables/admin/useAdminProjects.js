import { ref } from 'vue'
import { adminApi } from '../../api/admin'
import { translate } from '../../i18n'
import { extractAdminApiError } from '../../utils/admin'
import { useNotifications } from '../useNotifications'

const createInitialProjectForm = () => ({
  mode: 'create',
  userId: null,
  id: null,
  title: '',
  description: '',
})

export const useAdminProjects = ({ selectedUser, updateUserById, onStatsRefresh }) => {
  const notify = useNotifications()
  const showProjectModal = ref(false)
  const savingProject = ref(false)
  const deletingProjectId = ref(null)
  const projectFormError = ref('')
  const projectForm = ref(createInitialProjectForm())

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

  const updateProjectForm = (nextForm) => {
    projectForm.value = {
      ...projectForm.value,
      ...(nextForm || {}),
    }
  }

  const handleSaveProject = async () => {
    const payload = {
      title: (projectForm.value.title || '').trim(),
      description: (projectForm.value.description || '').trim(),
    }

    if (!payload.title) {
      projectFormError.value = translate('projects.titleRequired')
      return
    }

    savingProject.value = true
    projectFormError.value = ''
    try {
      if (projectForm.value.mode === 'create') {
        const created = await adminApi.createUserProject(projectForm.value.userId, payload)
        const createdProject = created?.project

        updateUserById(projectForm.value.userId, (user) => ({
          ...user,
          projects: [createdProject, ...(user.projects || [])],
          projects_count: (user.projects_count ?? user.projects.length ?? 0) + 1,
        }))
      } else {
        const updated = await adminApi.updateUserProject(
          projectForm.value.userId,
          projectForm.value.id,
          payload
        )
        const updatedProject = updated?.project

        updateUserById(projectForm.value.userId, (user) => ({
          ...user,
          projects: (user.projects || []).map((project) => (
            project.id === updatedProject.id ? { ...project, ...updatedProject } : project
          )),
        }))
      }

      closeProjectModal()
      await onStatsRefresh()
      notify.success(projectForm.value.mode === 'create' ? translate('projects.created') : translate('projects.updated'))
    } catch (error) {
      projectFormError.value = extractAdminApiError(error, translate('projects.saveFailed'))
    } finally {
      savingProject.value = false
    }
  }

  const handleDeleteProject = async (project) => {
    if (!selectedUser.value || !project?.id) return

    const confirmed = window.confirm(translate('projects.deleteConfirm', { title: project.title }))
    if (!confirmed) return

    deletingProjectId.value = project.id
    try {
      await adminApi.deleteUserProject(selectedUser.value.id, project.id)
      updateUserById(selectedUser.value.id, (user) => {
        const nextProjects = (user.projects || []).filter((entry) => entry.id !== project.id)
        return {
          ...user,
          projects: nextProjects,
          projects_count: Math.max(0, (user.projects_count ?? nextProjects.length) - 1),
        }
      })
      await onStatsRefresh()
      notify.success(translate('projects.deleted'))
    } catch (error) {
      notify.error(extractAdminApiError(error, translate('projects.deleteFailed')))
    } finally {
      deletingProjectId.value = null
    }
  }

  return {
    showProjectModal,
    savingProject,
    deletingProjectId,
    projectFormError,
    projectForm,
    openCreateProjectModal,
    openEditProjectModal,
    closeProjectModal,
    updateProjectForm,
    handleSaveProject,
    handleDeleteProject,
  }
}
