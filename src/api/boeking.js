import { api } from './client'

export const boekingApi = {
  list: () => api.get(`/boekingen`),
  get: (id) => api.get(`/boekingen/${id}`),
  add: (formData) => api.postFormData(`/boekingen`, formData),
  update: (id, formData) => api.patch(`/boekingen/${id}`, formData),
  remove: (id) => api.del(`/boekingen/${id}`),
  changeState: (id, state) => api.patch(`/boekingen/${id}/status`, state),
  vrijeToestellen: ({ beginDatum, eindDatum, toestelType }) => {
    const params = new URLSearchParams({ beginDatum, eindDatum, toestelType })
    return api.get(`/boekingen/toestellen/vrij?${params.toString()}`)
  },
  assignToestel: (boekingId, toestelId) =>
    api.patch(`/boekingen/${boekingId}/toestellen/assign`, { toestel: toestelId }),
}
