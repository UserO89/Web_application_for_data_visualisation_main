<template>
  <div class="app-layout">
    <AppHeader />

    <main class="app-main">
      <slot />
    </main>
  </div>
</template>

<script>
import AppHeader from './AppHeader.vue'

export default {
  name: 'AppLayout',
  components: { AppHeader },
}
</script>

<style scoped>
.app-main {
  flex: 1;
}
</style>
