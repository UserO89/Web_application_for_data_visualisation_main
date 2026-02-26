<template>
  <div class="profile-page app-content">
    <div class="profile-grid">
      <div class="panel">
        <div class="panel-head">
          <div style="font-weight: 700; font-size: 18px;">Profile</div>
          <div style="color: var(--muted); font-size: 13px;">Account settings</div>
        </div>

        <div v-if="authStore.loading" class="loading">Loading...</div>
        <div v-else-if="authStore.user" class="profile-info">
          <div class="avatar-row">
            <img
              v-if="authStore.user.avatar_url"
              :src="authStore.user.avatar_url"
              class="profile-avatar"
              alt="profile avatar"
            />
            <div v-else class="profile-avatar profile-avatar-fallback">
              {{ initials }}
            </div>
            <div class="avatar-actions">
              <input
                ref="avatarInput"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                class="hidden-input"
                @change="handleAvatarChange"
              />
              <button class="btn" @click="pickAvatar" :disabled="avatarUploading">
                {{ avatarUploading ? 'Uploading...' : 'Upload Photo' }}
              </button>
              <div class="avatar-hint">PNG/JPG/WEBP up to 5MB</div>
              <div v-if="avatarError" class="avatar-error">{{ avatarError }}</div>
            </div>
          </div>

          <div class="stat-card" style="margin-bottom: 12px;">
            <div class="stat-title">Name</div>
            <div class="stat-value profile-value">{{ authStore.user.name || '-' }}</div>
          </div>
          <div class="stat-card" style="margin-bottom: 12px;">
            <div class="stat-title">Email</div>
            <div class="stat-value profile-value">{{ authStore.user.email }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-title">Registered</div>
            <div class="stat-value profile-value-small">
              {{ authStore.user.created_at ? formatDate(authStore.user.created_at) : '-' }}
            </div>
          </div>
        </div>
      </div>

      <div class="panel">
        <div style="font-weight: 700; margin-bottom: 12px;">My Projects</div>
        <div v-if="projectsStore.loading" class="loading">Loading...</div>
        <div v-else-if="projectsStore.projects.length === 0" class="empty-state">
          No projects yet.
          <router-link :to="{ name: 'projects' }" style="color: var(--accent);">Create your first</router-link>.
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
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useProjectsStore } from '../stores/projects'

export default {
  name: 'ProfilePage',
  setup() {
    const authStore = useAuthStore()
    const projectsStore = useProjectsStore()
    const avatarInput = ref(null)
    const avatarUploading = ref(false)
    const avatarError = ref('')

    onMounted(async () => {
      await authStore.fetchUser()
      await projectsStore.fetchProjects()
    })

    const initials = computed(() => {
      const value = (authStore.user?.name || 'User').trim()
      if (!value) return 'U'

      const parts = value.split(/\s+/).filter(Boolean)
      const first = parts[0]?.[0] || ''
      const second = parts[1]?.[0] || ''
      return (first + second).toUpperCase()
    })

    const pickAvatar = () => {
      avatarInput.value?.click()
    }

    const handleAvatarChange = async (event) => {
      const file = event.target.files?.[0]
      if (!file) return

      avatarError.value = ''
      avatarUploading.value = true

      try {
        await authStore.uploadAvatar(file)
      } catch (error) {
        avatarError.value = error?.response?.data?.message || 'Failed to upload image'
      } finally {
        avatarUploading.value = false
        event.target.value = ''
      }
    }

    const formatDate = (str) => {
      if (!str) return '-'
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
      avatarInput,
      avatarUploading,
      avatarError,
      initials,
      pickAvatar,
      handleAvatarChange,
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

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.profile-info {
  display: flex;
  flex-direction: column;
}

.avatar-row {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 16px;
}

.profile-avatar {
  width: 76px;
  height: 76px;
  border-radius: 999px;
  object-fit: cover;
  border: 1px solid var(--border);
  background: #202020;
}

.profile-avatar-fallback {
  display: grid;
  place-items: center;
  font-weight: 700;
  color: var(--text);
}

.avatar-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.hidden-input {
  display: none;
}

.avatar-hint {
  color: var(--muted);
  font-size: 12px;
}

.avatar-error {
  color: #ff8f8f;
  font-size: 12px;
}

.profile-value {
  font-size: 16px;
}

.profile-value-small {
  font-size: 14px;
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
  border: 1px solid var(--border);
}

.project-preview-card:hover {
  background: #2a2a2a;
  color: var(--accent);
}

.loading,
.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--muted);
}

@media (max-width: 640px) {
  .avatar-row {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
