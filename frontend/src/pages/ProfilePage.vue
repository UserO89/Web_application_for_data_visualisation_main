<template>
  <div class="profile-page app-content">
    <div class="profile-grid">
      <div class="panel" style="grid-column: 1 / -1;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <div style="font-weight: 700; font-size: 18px;">Profile</div>
          <div style="color: var(--muted); font-size: 13px;">User profile</div>
        </div>

        <div v-if="authStore.loading" class="loading">Loading...</div>
        <div v-else-if="authStore.user" class="profile-info">
          <div class="stat-card" style="margin-bottom: 12px;">
            <div class="stat-title">Name</div>
            <div class="stat-value" style="font-size: 16px;">{{ authStore.user.name || '—' }}</div>
          </div>
          <div class="stat-card" style="margin-bottom: 12px;">
            <div class="stat-title">Email</div>
            <div class="stat-value" style="font-size: 16px;">{{ authStore.user.email }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-title">Registered</div>
            <div class="stat-value" style="font-size: 14px;">
              {{ authStore.user.created_at ? formatDate(authStore.user.created_at) : '—' }}
            </div>
          </div>
        </div>
      </div>

      <div class="panel" style="grid-column: 1 / -1;">
        <div style="font-weight: 700; margin-bottom: 12px;">My Projects</div>
        <div v-if="projectsStore.loading" class="loading">Loading...</div>
        <div v-else-if="projectsStore.projects.length === 0" class="empty-state">
          No projects yet. <router-link :to="{ name: 'projects' }" style="color: var(--accent);">Create your first</router-link>.
        </div>
        <div v-else class="projects-preview">
          <div
            v-for="p in projectsStore.projects.slice(0, 5)"
            :key="p.id"
            class="project-preview-card"
            @click="$router.push({ name: 'project', params: { id: p.id } })"
          >
            <div style="font-weight: 600;">{{ p.title }}</div>
            <div style="font-size: 12px; color: var(--muted);">
              {{ p.dataset ? 'With data' : 'No data' }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useProjectsStore } from '../stores/projects'

export default {
  name: 'ProfilePage',
  setup() {
    const authStore = useAuthStore()
    const projectsStore = useProjectsStore()

    onMounted(async () => {
      await authStore.fetchUser()
      await projectsStore.fetchProjects()
    })

    const formatDate = (str) => {
      if (!str) return '—'
      const d = new Date(str)
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    }

    return {
      authStore,
      projectsStore,
      formatDate,
    }
  },
}
</script>

<style scoped>
.profile-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.profile-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 18px;
}

.profile-info {
  display: flex;
  flex-direction: column;
}

.projects-preview {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.project-preview-card {
  padding: 12px;
  background: var(--glass);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid rgba(255, 255, 255, 0.02);
}

.project-preview-card:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--accent);
}

.loading,
.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--muted);
}
</style>
