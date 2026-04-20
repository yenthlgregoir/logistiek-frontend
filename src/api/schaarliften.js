import { api } from './client'

export const schaarliftenApi = {
  list: (query = {}) => {
    const params = new URLSearchParams(query).toString()
    return api.get(`/logistics/hoogtewerker?${params}`)
  },
  create: (data) => api.post('/logistics/hoogtewerker', data),
  update: (id, data) => api.patch(`/logistics/hoogtewerker/${id}`, data),
  getTypes: () => api.get('/logistics/hoogtewerker/types'),
  createType: (data) => api.post('/logistics/hoogtewerker/types', data),
  toPdf: () => api.get('/logistics/hoogtewerker/pdf',  { responseType: 'blob' })
}
