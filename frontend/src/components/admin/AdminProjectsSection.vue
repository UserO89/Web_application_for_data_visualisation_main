<template>
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
        :disabled="!selectedUser"
        @click="$emit('create-project')"
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
          <button class="btn" type="button" @click="$emit('edit-project', project)">Edit</button>
          <button
            class="btn danger"
            type="button"
            :disabled="deletingProjectId === project.id"
            @click="$emit('delete-project', project)"
          >
            {{ deletingProjectId === project.id ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  name: 'AdminProjectsSection',
  props: {
    selectedUser: {
      type: Object,
      default: null,
    },
    deletingProjectId: {
      type: [Number, String],
      default: null,
    },
  },
  emits: ['create-project', 'edit-project', 'delete-project'],
}
</script>

<style scoped>
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

.empty-state {
  color: var(--muted);
  text-align: center;
  padding: 20px;
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

@media (max-width: 680px) {
  .project-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .project-actions {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
