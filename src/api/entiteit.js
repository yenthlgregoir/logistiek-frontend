import { api } from './client'

const BASE = '/entiteiten'

export const entiteitApi = {
  getEntiteiten: () => api.get(BASE),

  createEniteit: (data) => api.post(BASE, data),

  updateEntiteit: (id, data) =>
    api.put(`${BASE}/${encodeURIComponent(id)}`, data),
}