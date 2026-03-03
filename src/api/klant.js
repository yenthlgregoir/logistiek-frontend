import { api } from './client'

export const klantApi = {
  list: () => api.get(`/klant`),
  get: (id) => api.get(`/klant/${id}`),
  add: (formData) => api.postFormData(`/klant`, formData),
  update: (id, formData) => api.patch(`/klant/${id}`, formData),
  remove: (id) => api.del(`/klant/${id}`),
  addLeverAdres: (id, formData) => api.postFormData(`/klant/${id}/leveradressen`, formData),
  removeLeverAdres: (id, adresId) => api.del(`/klant/${id}/leveradressen/${adresId}`),
}
