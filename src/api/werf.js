import { api } from './client'

export const werfApi = {
  list: (query = {}) => {
    const params = new URLSearchParams(query).toString()
    return api.get(`/logistics/werf?${params}`)
  },
  create: (data) => api.post('/logistics/werf', data),
  getById: (id) => api.get(`/logistics/werf/${id}`),
  remove: (id) => api.del(`/logistics/werf/${id}`),
  update: (id, data) => api.patch(`/logistics/werf/${id}`, data),
}
