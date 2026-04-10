import { defineStore } from 'pinia'
import { authApi } from '../api/auth'
import { setLocale } from '../i18n'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    loading: false,
  }),

  getters: {
    isAuthenticated: (state) => state.user !== null,
    isAdmin: (state) => state.user?.role === 'admin',
  },

  actions: {
    applyAuthenticatedUser(user) {
      this.user = user

      if (user?.locale) {
        setLocale(user.locale)
      }
    },

    async register(data) {
      this.loading = true
      try {
        const response = await authApi.register(data)
        this.applyAuthenticatedUser(response.user)
        return response
      } finally {
        this.loading = false
      }
    },

    async login(data) {
      this.loading = true
      try {
        const response = await authApi.login(data)
        this.applyAuthenticatedUser(response.user)
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
        this.applyAuthenticatedUser(response.user)
      } catch (error) {
        this.user = null
        throw error
      }
    },

    async updateProfile(data) {
      this.loading = true
      try {
        const response = await authApi.updateProfile(data)
        this.applyAuthenticatedUser(response.user)
        return response
      } finally {
        this.loading = false
      }
    },

    async updatePreferredLocale(locale) {
      this.loading = true
      try {
        const response = await authApi.updateProfile({ locale })
        this.applyAuthenticatedUser(response.user)
        return response
      } finally {
        this.loading = false
      }
    },

    async changePassword(data) {
      this.loading = true
      try {
        return await authApi.updatePassword(data)
      } finally {
        this.loading = false
      }
    },

    async deleteAccount(data) {
      this.loading = true
      try {
        await authApi.deleteAccount(data)
        this.user = null
      } finally {
        this.loading = false
      }
    },

    async uploadAvatar(file) {
      this.loading = true
      try {
        const response = await authApi.uploadAvatar(file)
        this.applyAuthenticatedUser(response.user)
        return response
      } finally {
        this.loading = false
      }
    },
  },
})
