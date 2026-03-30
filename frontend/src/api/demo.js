import { http } from './http'

const DEMO_BASE_PATH = '/demo/project'

export const demoProjectsApi = {
  async get() {
    const response = await http.get(DEMO_BASE_PATH)
    return response.data
  },

  async getRows(_projectId, page = 1, perPage = 100) {
    const response = await http.get(`${DEMO_BASE_PATH}/rows`, {
      params: { page, per_page: perPage },
    })
    return response.data
  },

  async getStatistics() {
    const response = await http.get(`${DEMO_BASE_PATH}/statistics`)
    return response.data
  },

  async getChartSuggestions() {
    const response = await http.get(`${DEMO_BASE_PATH}/chart-suggestions`)
    return response.data
  },

  async getSchema(_projectId, options = {}) {
    const response = await http.get(`${DEMO_BASE_PATH}/schema`, {
      params: {
        rebuild: options.rebuild ? 1 : 0,
      },
    })
    return response.data
  },
}
