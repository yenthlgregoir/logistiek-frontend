import { api } from './client'

export const entiteitApi = {
  getEntiteiten: () => api.get(`/logistics/entiteit`),
  createEniteit: (data) => api.post(`/logistics/entiteit`, data),
}
