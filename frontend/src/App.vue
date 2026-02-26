<template>
  <div id="app">
    <AppLayout v-if="showLayout">
      <router-view />
    </AppLayout>
    <router-view v-else />
  </div>
</template>

<script>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from './stores/auth'
import AppLayout from './components/AppLayout.vue'

export default {
  name: 'App',
  components: { AppLayout },
  setup() {
    const route = useRoute()
    const authStore = useAuthStore()

    const showLayout = computed(() => {
      return authStore.isAuthenticated && route.name !== 'login'
    })

    return { showLayout }
  },
}
</script>
