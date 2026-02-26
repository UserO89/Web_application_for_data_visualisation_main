import axios from 'axios'

// In dev we use relative URLs — requests go through Vite proxy to same origin,
// so cookies and CSRF work. Otherwise request from 5173 to 8088 is cross-origin, cookies won't be sent.
const baseURL = import.meta.env.DEV ? '/api/v1' : (import.meta.env.VITE_API_URL || 'http://localhost:8088/api/v1')

export const http = axios.create({
  baseURL,
  withCredentials: true,

  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',

  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
})

export async function csrf() {
  const url = import.meta.env.DEV
    ? '/sanctum/csrf-cookie'
    : (baseURL.replace(/\/api\/v1\/?$/, '') + '/sanctum/csrf-cookie')
  await axios.get(url, { withCredentials: true })
}