import { defineStore } from 'pinia'
import { authApi } from '../api/auth'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    loading: false,
  }),

  getters: {
    isAuthenticated: (state) => state.user !== null,
  },

  actions: {
    async register(data) {
      this.loading = true
      try {
        const response = await authApi.register(data)
        this.user = response.user
        return response
      } finally {
        this.loading = false
      }
    },

    async login(data) {
      this.loading = true
      try {
        const response = await authApi.login(data)
        this.user = response.user
        return response
      } finally {
        this.loading = false
      }
    },

    async logout() {
      this.loading = true
      try {
        await authApi.logout()
        this.user = null
      } finally {
        this.loading = false
      }
    },

    async fetchUser() {
      try {
        const response = await authApi.me()
        this.user = response.user
      } catch (error) {
        this.user = null
      }
    },
  },
})
