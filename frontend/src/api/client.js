import axios from 'axios'

let API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

// Ensure URL doesn't end with a slash to avoid double slashes when appending endpoints
if (API_URL.endsWith('/')) {
  API_URL = API_URL.slice(0, -1)
}

console.log('[API] Using backend URL:', API_URL)

const api = axios.create({
  baseURL: API_URL,
  timeout: 120000 // Increase to 120 seconds for Render cold starts and LLM retries
})

// Add logging interceptor
api.interceptors.response.use(
  response => {
    console.log('[API] Response:', response.config.method.toUpperCase(), response.config.url, response.status)
    return response
  },
  error => {
    console.error('[API] Error:', error.config?.method?.toUpperCase(), error.config?.url, error.message)
    return Promise.reject(error)
  }
)

export const sendQuery = (question) =>
  api.post('/query', { question }).then(r => r.data)

export const uploadCSV = (file) => {
  const form = new FormData()
  form.append('file', file)
  return api.post('/upload-csv', form).then(r => r.data)
}

export const fetchHistory = () =>
  api.get('/history').then(r => r.data.history)

export const fetchSchema = () =>
  api.get('/schema').then(r => r.data)

export const clearCache = () =>
  api.delete('/cache').then(r => r.data)
