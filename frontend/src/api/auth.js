import { http, csrf } from './http'

export const authApi = {
  async register(data) {
    await csrf()
    const response = await http.post('/auth/register', data)
    return response.data
  },

  async login(data) {
    await csrf()
    const response = await http.post('/auth/login', data)
    return response.data
  },

  async logout() {
    const response = await http.post('/auth/logout')
    return response.data
  },

  async me() {
    const response = await http.get('/auth/me')
    return response.data
  },
}
