<template>
  <div class="app-layout">
    <header class="app-header">
      <router-link :to="{ name: 'projects' }" class="brand">
        <div class="logo">DV</div>
        <div>
          <div class="title">DataVis Studio</div>
          <div class="subtitle">interactive data visualization</div>
        </div>
      </router-link>

      <div class="nav-wrap" ref="navWrap">
        <nav class="app-nav" ref="nav">
          <router-link
            v-for="item in navItems"
            :key="item.key"
            :to="item.to"
            :class="['nav-item', { active: isActive(item.to) }]"
            :data-key="item.key"
          >
            {{ item.label }}
          </router-link>
          <button class="nav-item" @click="handleLogout">Logout</button>
        </nav>
        <div
          class="nav-underline"
          ref="underline"
          :style="underlineStyle"
        ></div>
      </div>
    </header>

    <main class="app-main">
      <slot />
    </main>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

export default {
  name: 'AppLayout',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const authStore = useAuthStore()
    const nav = ref(null)
    const underline = ref(null)
    const navWrap = ref(null)

    const navItems = [
      { key: 'projects', label: 'Projects', to: { name: 'projects' } },
      { key: 'profile', label: 'Profile', to: { name: 'profile' } },
    ]

    const isActive = (to) => {
      if (!to.name) return false
      if (to.name === 'projects') return route.name === 'projects'
      if (to.name === 'profile') return route.name === 'profile'
      if (to.name === 'project') return route.name === 'project'
      return false
    }

    const underlineStyle = ref({
      width: '80px',
      left: '12px',
    })

    const moveUnderlineTo = (el) => {
      if (!el || !nav.value || !underline.value) return
      const rect = el.getBoundingClientRect()
      const parentRect = nav.value.getBoundingClientRect()
      underlineStyle.value = {
        width: rect.width + 'px',
        left: rect.left - parentRect.left + 'px',
      }
    }

    onMounted(() => {
      const activeEl = nav.value?.querySelector('.nav-item.active')
      if (activeEl) moveUnderlineTo(activeEl)
    })

    watch(
      () => route.path,
      () => {
        setTimeout(() => {
          const activeEl = nav.value?.querySelector('.nav-item.active')
          if (activeEl) moveUnderlineTo(activeEl)
        }, 50)
      }
    )

    const handleLogout = async () => {
      await authStore.logout()
      router.push({ name: 'login' })
    }

    return {
      nav,
      navWrap,
      underline,
      navItems,
      underlineStyle,
      isActive,
      handleLogout,
    }
  },
}
</script>

<style scoped>
.app-main {
  flex: 1;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
