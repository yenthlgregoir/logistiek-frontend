import { api } from './client'

export const leiderApi = {
  list: (query = {}) => {
    const params = new URLSearchParams(query).toString()
    return api.get(`/logistics/projectleider?${params}`)
  },
  create: (data) => api.post('/logistics/projectleider', data),
  getById: (id) => api.get(`/logistics/projectleider/${id}`),
  remove: (id) => api.del(`/logistics/projectleider/${id}`),
  update: (id, data) => api.patch(`/logistics/projectleider/${id}`, data),
  
}
