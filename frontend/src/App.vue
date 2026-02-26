<template>
  <div id="app">
    <AppLayout v-if="showLayout">
      <router-view />
    </AppLayout>
    <router-view v-else />
  </div>
</template>

<script>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from './stores/auth'
import AppLayout from './components/AppLayout.vue'

export default {
  name: 'App',
  components: { AppLayout },
  setup() {
    const route = useRoute()
    const authStore = useAuthStore()

    onMounted(async () => {
      if (!authStore.user) {
        try {
          await authStore.fetchUser()
        } catch (_) {}
      }
    })

    const showLayout = computed(() => {
      return authStore.isAuthenticated && route.meta?.requiresAuth
    })

    return { showLayout }
  },
}
</script>
