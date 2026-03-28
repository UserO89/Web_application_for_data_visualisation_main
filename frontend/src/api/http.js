import axios from 'axios'

function resolveApiBaseUrl() {
  const value = import.meta.env.VITE_API_BASE_URL

  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(
      '[config] Missing VITE_API_BASE_URL. Set it in frontend/.env.development and frontend/.env.production.'
    )
  }

  return value.trim().replace(/\/+$/, '')
}

function resolveCsrfUrl(apiBaseUrl) {
  return apiBaseUrl.replace(/\/api\/v1$/, '') + '/sanctum/csrf-cookie'
}

const baseURL = resolveApiBaseUrl()
const csrfUrl = resolveCsrfUrl(baseURL)
let csrfRequestPromise = null

function isMutationMethod(method) {
  const normalized = String(method || '').toLowerCase()
  return normalized === 'post' || normalized === 'put' || normalized === 'patch' || normalized === 'delete'
}

export const http = axios.create({
  baseURL,
  withCredentials: true,
  withXSRFToken: true,

  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',

  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
})

export async function csrf() {
  if (!csrfRequestPromise) {
    csrfRequestPromise = axios
      .get(csrfUrl, { withCredentials: true })
      .finally(() => {
        csrfRequestPromise = null
      })
  }

  await csrfRequestPromise
}

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = Number(error?.response?.status || 0)
    const requestConfig = error?.config
    const requestUrl = String(requestConfig?.url || '')
    const alreadyRetried = Boolean(requestConfig?._csrfRetried)

    if (
      status === 419 &&
      requestConfig &&
      isMutationMethod(requestConfig.method) &&
      !requestUrl.includes('/sanctum/csrf-cookie') &&
      !alreadyRetried
    ) {
      requestConfig._csrfRetried = true
      try {
        await csrf()
        return await http.request(requestConfig)
      } catch (_) {
        // If CSRF refresh fails, return original error for caller handling.
      }
    }

    return Promise.reject(error)
  }
)
