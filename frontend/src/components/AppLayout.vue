<template>
  <div :class="['app-layout', { 'project-page-layout': isProjectRoute }]">
    <AppHeader />

    <main class="app-main">
      <slot />
    </main>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from './AppHeader.vue'

export default {
  name: 'AppLayout',
  components: { AppHeader },
  setup() {
    const route = useRoute()
    const isProjectRoute = computed(() => route.name === 'project')
    return { isProjectRoute }
  },
}
</script>

<style scoped>
.app-layout.project-page-layout {
  max-width: 1200px;
}

.app-main {
  flex: 1;
}

.app-layout.project-page-layout .app-main {
  width: min(1680px, calc(100vw - 48px));
  align-self: center;
}
</style>
