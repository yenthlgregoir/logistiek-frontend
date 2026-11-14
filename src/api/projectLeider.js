import { api } from './client'

const BASE = '/projectleiders'

export const leiderApi = {
  list: (query = {}) => {
    const params = new URLSearchParams()

    for (const [key, value] of Object.entries(query)) {
      if (value != null && value !== '') {
        params.set(key, String(value))
      }
    }

    const search = params.toString()
    return api.get(`${BASE}${search ? `?${search}` : ''}`)
  },

  create: (data) => api.post(BASE, data),

  getById: (id) =>
    api.get(`${BASE}/${encodeURIComponent(id)}`),

  remove: (id) =>
    api.del(`${BASE}/${encodeURIComponent(id)}`),

  update: (id, data) =>
    api.put(`${BASE}/${encodeURIComponent(id)}`, data),
}