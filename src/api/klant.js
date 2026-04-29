import { api } from './client'

export const klantApi = {
  list: () => api.get(`/renting/klant`),
  get: (id) => api.get(`/renting/klant/${id}`),
  add: (formData) => api.postFormData(`/renting/klant`, formData),
  update: (id, formData) => api.patch(`/renting/klant/${id}`, formData),
  remove: (id) => api.del(`/renting/klant/${id}`),
  addLeverAdres: (id, formData) => api.postFormData(`/renting/klant/${id}/leveradressen`, formData),
  removeLeverAdres: (id, adresId) => api.del(`/renting/klant/${id}/leveradressen/${adresId}`),
  updateLeverAdres: (id, adres) => api.patch(`/renting/klant/${id}/leveradres`, { adres }),
}
