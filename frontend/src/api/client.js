import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api'
})

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
