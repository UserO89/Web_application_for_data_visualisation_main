<template>
  <div v-if="isOpen" class="modal-overlay" @click="$emit('close')">
    <div class="modal panel" @click.stop>
      <h2 class="modal-title">
        {{ form.mode === 'create' ? $t('admin.projects.modal.createTitle') : $t('admin.projects.modal.editTitle') }}
      </h2>
      <form @submit.prevent="$emit('save')">
        <div class="form-group">
          <label for="admin-project-title">{{ $t('projects.projectTitle') }}</label>
          <input
            id="admin-project-title"
            :value="form.title"
            name="title"
            type="text"
            required
            maxlength="255"
            @input="updateField('title', $event.target.value)"
          />
        </div>
        <div class="form-group">
          <label for="admin-project-description">{{ $t('projects.projectDescription') }}</label>
          <textarea
            id="admin-project-description"
            :value="form.description"
            name="description"
            rows="3"
            maxlength="1000"
            @input="updateField('description', $event.target.value)"
          ></textarea>
        </div>

        <div v-if="error" class="error-text">{{ error }}</div>

        <div class="modal-actions">
          <button class="btn" type="button" @click="$emit('close')">{{ $t('common.cancel') }}</button>
          <button class="btn primary" type="submit" :disabled="saving">
            {{ saving ? $t('admin.projects.modal.saving') : (form.mode === 'create' ? $t('common.create') : $t('common.saveChanges')) }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AdminProjectModal',
  props: {
    isOpen: {
      type: Boolean,
      default: false,
    },
    form: {
      type: Object,
      default: () => ({
        mode: 'create',
        userId: null,
        id: null,
        title: '',
        description: '',
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
