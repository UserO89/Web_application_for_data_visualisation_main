<template>
  <div v-if="isOpen" class="modal-overlay" @click="$emit('close')">
    <div class="modal panel" @click.stop>
      <h2 class="modal-title">Edit User</h2>
      <form @submit.prevent="$emit('save')">
        <div class="form-group">
          <label>Name</label>
          <input
            :value="form.name"
            type="text"
            required
            maxlength="120"
            @input="updateField('name', $event.target.value)"
          />
        </div>
        <div class="form-group">
          <label>Email</label>
          <input
            :value="form.email"
            type="email"
            required
            maxlength="190"
            @input="updateField('email', $event.target.value)"
          />
        </div>
        <div class="form-group">
          <label>Role</label>
          <select
            :value="form.role"
            :disabled="form.id === currentUserId"
            @change="updateField('role', $event.target.value)"
          >
            <option value="user">user</option>
            <option value="admin">admin</option>
          </select>
        </div>
        <div class="form-group">
          <label>New password (optional)</label>
          <input
            :value="form.password"
            type="password"
            minlength="8"
            @input="updateField('password', $event.target.value)"
          />
        </div>

        <div v-if="error" class="error-text">{{ error }}</div>

        <div class="modal-actions">
          <button class="btn" type="button" @click="$emit('close')">Cancel</button>
          <button class="btn primary" type="submit" :disabled="saving">
            {{ saving ? 'Saving...' : 'Save' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AdminUserModal',
  props: {
    isOpen: {
      type: Boolean,
      default: false,
    },
    form: {
      type: Object,
      default: () => ({
        id: null,
        name: '',
        email: '',
        role: 'user',
        password: '',
      }),
    },
    error: {
      type: String,
      default: '',
    },
    saving: {
      type: Boolean,
      default: false,
    },
    currentUserId: {
      type: [Number, String],
      default: null,
    },
  },
  emits: ['close', 'save', 'update:form'],
  setup(props, { emit }) {
    const updateField = (field, value) => {
      emit('update:form', {
        ...props.form,
        [field]: value,
      })
    }

    return {
      updateField,
    }
  },
}
</script>

<style scoped>
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

.modal-title {
  margin-bottom: 14px;
  font-size: 18px;
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

.error-text {
  color: #ff9b9b;
  font-size: 13px;
  margin-bottom: 10px;
}

.modal-actions {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
