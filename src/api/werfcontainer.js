import { api } from './client'

const BASE = '/werfcontainers'

export const werfcontainerApi = {
  list: (query = {}) => {
    const params = new URLSearchParams()

    for (const [key, value] of Object.entries(query)) {
      if (value != null && value !== '' && value !== 'undefined') {
        params.set(key, String(value))
      }
    }

    const search = params.toString()
    return api.get(`${BASE}${search ? `?${search}` : ''}`)
  },

  create: (data) => api.post(BASE, data),

  update: (id, data) =>
    api.put(`${BASE}/${encodeURIComponent(id)}`, data),

  getTypes: () => api.get(`${BASE}/types`),

  createType: (data) =>
    api.post('/machinetypes', {
      ...data,
      type: 'Werfcontainer',
    }),
}