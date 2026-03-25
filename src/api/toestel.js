import { api } from './client'

export const toestelApi = {
  list: (query = {}) => {
    const params = new URLSearchParams(query).toString()
    return api.get(`/renting/toestellen?${params}`)
  },
  create: (data) => api.post('/renting/toestellen', data),
  update: (id, data) => api.patch(`/renting/toestellen/${id}`, data),
  remove: (id) => api.del(`/renting/${id}/toestellen`),
  getTypes: () => api.get('/renting/toestellen/types'),
  changeStatus: (id, data) => api.patch(`/renting/toestellen/types/${id}`, data),
}
