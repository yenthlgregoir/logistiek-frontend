import { api } from './client'

export const verhuurApi = {
  list: (query = {}) => {
    const params = new URLSearchParams(query).toString()
    return api.get(`/logistics/verhuur?${params}`)
  },
  create: (data) => api.post('/logistics/verhuur', data),
  getById: (id) => api.get(`/logistics/verhuur/${id}`),
  remove: (id) => api.del(`/logistics/verhuur/${id}`),
  update: (id, data) => api.patch(`/logistics/verhuur/update/${id}`, data),
  vrijeToestellen: ({ ophaalDatum, leverDatum, assetModel, werkhoogte }) => {
    const params = new URLSearchParams({ ophaalDatum, leverDatum, assetModel, werkhoogte })
    return api.get(`/logistics/verhuur/vrije-assets?${params.toString()}`)
  },
  assignToestel: (data) => api.patch(`/logistics/verhuur/assignToestel`, data),
  exportVerhuur: (id) => api.get(`/logistics/verhuur/export-pdf/${id}`, { responseType: 'blob' }),
}
