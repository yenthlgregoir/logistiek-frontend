import { api } from './client'

export const boekingApi = {
  list: ({ search, startDatum, eindDatum, archief } = {}) => {
    const params = new URLSearchParams({ search, startDatum, eindDatum, archief })
    return api.get(`/renting/boekingen?${params.toString()}`)
  },
  get: (id) => api.get(`/renting/boekingen/${id}`),
  add: (formData) => api.postFormData(`/renting/boekingen`, formData),
  update: (id, formData) => api.patch(`/renting/boekingen/${id}`, formData),
  remove: (id) => api.del(`/renting/boekingen/${id}`),
  changeState: (id, state) => api.patch(`/renting/boekingen/${id}/status`, state),
  vrijeToestellen: ({ beginDatum, eindDatum, toestelType }) => {
    const params = new URLSearchParams({ beginDatum, eindDatum, toestelType })
    return api.get(`/renting/boekingen/toestellen/vrij?${params.toString()}`)
  },
  assignToestel: (boekingId, toestelId) =>
    api.patch(`/renting/boekingen/${boekingId}/toestellen/assign`, { toestel: toestelId }),
  updatePeriode: (boekingId, beginDatum, eindDatum) =>
    api.patch(`/renting/boekingen/periode/update`, {
      boekingId: boekingId,
      beginDatum: beginDatum,
      eindDatum: eindDatum,
    }),
}
