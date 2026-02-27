import { http } from './http'

export const adminApi = {
  async getStats() {
    const response = await http.get('/admin/stats')
    return response.data
  },

  async listUsers(search = '') {
    const response = await http.get('/admin/users', {
      params: { q: search || undefined },
    })
    return response.data
  },

  async updateUser(userId, payload) {
    const response = await http.patch(`/admin/users/${userId}`, payload)
    return response.data
  },

  async deleteUser(userId) {
    const response = await http.delete(`/admin/users/${userId}`)
    return response.data
  },

  async createUserProject(userId, payload) {
    const response = await http.post(`/admin/users/${userId}/projects`, payload)
    return response.data
  },

  async updateUserProject(userId, projectId, payload) {
    const response = await http.patch(`/admin/users/${userId}/projects/${projectId}`, payload)
    return response.data
  },

  async deleteUserProject(userId, projectId) {
    const response = await http.delete(`/admin/users/${userId}/projects/${projectId}`)
    return response.data
  },
}
