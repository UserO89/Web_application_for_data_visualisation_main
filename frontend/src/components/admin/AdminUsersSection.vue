<template>
  <section class="panel">
    <div class="section-head">
      <div>
        <div class="section-title">Users</div>
        <div class="section-subtitle">
          Select a user to manage projects. Until selection, project list stays hidden.
        </div>
      </div>
    </div>

    <form class="search-row" @submit.prevent="$emit('search')">
      <input
        :value="search"
        type="text"
        placeholder="Search by name or email"
        @input="$emit('update:search', $event.target.value)"
      />
      <button class="btn" type="submit">Search</button>
      <button v-if="search" class="btn" type="button" @click="$emit('clear')">Clear</button>
    </form>

    <div v-if="error" class="error-text">{{ error }}</div>
    <div v-if="loading" class="loading">Loading users...</div>
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
            <div v-else class="user-avatar user-avatar-fallback">{{ getAdminInitials(user.name) }}</div>
            <div>
              <div class="user-name">{{ user.name }}</div>
              <div class="user-meta">
                {{ user.email }} - joined {{ formatAdminDate(user.created_at) }} -
                {{ projectCount(user) }} projects
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
              @click="$emit('select-user', user)"
            >
              {{ selectedUserId === user.id ? 'Selected' : 'Select' }}
            </button>
            <button class="btn" type="button" @click="$emit('edit-user', user)">Edit user</button>
            <button
              class="btn danger"
              type="button"
              :disabled="deletingUserId === user.id || user.id === currentUserId"
              @click="$emit('delete-user', user)"
            >
              {{ deletingUserId === user.id ? 'Deleting...' : 'Delete user' }}
            </button>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>

<script>
import { formatAdminDate, getAdminInitials } from '../../utils/admin'

export default {
  name: 'AdminUsersSection',
  props: {
    users: {
      type: Array,
      default: () => [],
    },
    search: {
      type: String,
      default: '',
    },
    loading: {
      type: Boolean,
      default: false,
    },
    error: {
      type: String,
      default: '',
    },
    selectedUserId: {
      type: [Number, String],
      default: null,
    },
    deletingUserId: {
      type: [Number, String],
      default: null,
    },
    currentUserId: {
      type: [Number, String],
      default: null,
    },
  },
  emits: ['update:search', 'search', 'clear', 'select-user', 'edit-user', 'delete-user'],
  setup() {
    const projectCount = (user) => user.projects_count ?? user.projects?.length ?? 0

    return {
      formatAdminDate,
      getAdminInitials,
      projectCount,
    }
  },
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

.btn.danger {
  color: #ff9b9b;
}

.btn.danger:hover {
  background: #382121;
  color: #ffc0c0;
}

@media (max-width: 680px) {
  .user-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .user-actions {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
