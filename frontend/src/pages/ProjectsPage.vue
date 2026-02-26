<template>
  <div class="projects-page app-content">
    <div class="panel" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
      <div style="font-weight: 700; font-size: 18px;">My Projects</div>
      <button @click="showCreateModal = true" class="btn primary">+ New Project</button>
    </div>

    <div v-if="projectsStore.loading" class="loading">Loading...</div>
    <div v-else-if="projectsStore.projects.length === 0" class="empty-state panel">
      <p>No projects yet. Create your first one!</p>
    </div>
    <div v-else class="projects-grid">
      <div
        v-for="project in projectsStore.projects"
        :key="project.id"
        class="project-card panel"
        @click="goToProject(project.id)"
      >
        <div style="font-weight: 700; margin-bottom: 8px;">{{ project.title }}</div>
        <p v-if="project.description" style="color: var(--muted); font-size: 14px; margin-bottom: 12px;">{{ project.description }}</p>
        <div style="font-size: 12px; color: var(--muted);">
          {{ project.dataset ? 'With data' : 'No data' }}
        </div>
      </div>
    </div>

    <!-- Create Project Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click="showCreateModal = false">
      <div class="modal panel" @click.stop>
        <h2 style="margin-bottom: 16px; font-size: 18px;">Create Project</h2>
        <form @submit.prevent="handleCreate">
          <div class="form-group">
            <label>Title</label>
            <input v-model="newProject.title" type="text" required />
          </div>
          <div class="form-group">
            <label>Description (optional)</label>
            <textarea v-model="newProject.description" rows="3"></textarea>
          </div>
          <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 16px;">
            <button type="button" @click="showCreateModal = false" class="btn">Cancel</button>
            <button type="submit" class="btn primary">Create</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectsStore } from '../stores/projects'

export default {
  name: 'ProjectsPage',
  setup() {
    const router = useRouter()
    const projectsStore = useProjectsStore()
    const showCreateModal = ref(false)
    const newProject = ref({
      title: '',
      description: '',
    })

    onMounted(async () => {
      await projectsStore.fetchProjects()
    })

    const goToProject = (id) => {
      router.push({ name: 'project', params: { id } })
    }

    const handleCreate = async () => {
      try {
        const project = await projectsStore.createProject(newProject.value)
        showCreateModal.value = false
        newProject.value = { title: '', description: '' }
        goToProject(project.id)
      } catch (error) {
        console.error('Failed to create project:', error)
      }
    }

    return {
      projectsStore,
      showCreateModal,
      newProject,
      goToProject,
      handleCreate,
    }
  },
}
</script>

<style scoped>
.projects-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.app-content {
  flex: 1;
}

.loading,
.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--muted);
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 18px;
}

.project-card {
  cursor: pointer;
  transition: all 0.28s cubic-bezier(0.2, 0.9, 0.3, 1);
}

.project-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(2, 6, 23, 0.65);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.02));
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}
</style>
