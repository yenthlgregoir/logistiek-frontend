import { api } from './client'

export const toestelApi = {
  list: (query = {}) => {
  const params = new URLSearchParams(query).toString()
  return api.get(`/toestellen?${params}`)
},
  create: (data) => api.post('/toestellen', data),
  update: (id, data) => api.patch(`/toestellen/${id}`, data),
  remove: (id) => api.del(`/${id}/toestellen`),
  getTypes: () => api.get('/toestellen/types'),
  changeStatus: (id, data) => api.patch(`/toestellen/types/${id}`, data),
}
