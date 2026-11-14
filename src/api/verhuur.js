import { api } from './client'

const BASE = '/verhuur'

function idOf(value) {
  return value && typeof value === 'object' ? value.id : value
}

function modelOf(value) {
  return typeof value === 'string' ? value.toUpperCase() : value
}

function queryString(query) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value == null || value === '' || value === 'undefined') continue
    if (key === 'assetModel' && value === 'all') continue
    params.set(key, key === 'assetModel' ? modelOf(value) : String(value))
  }
  const search = params.toString()
  return search ? `?${search}` : ''
}

function payload(data) {
  return {
    assetModel: modelOf(data.assetModel),
    assetType: data.assetType,
    werfId: idOf(data.werfId ?? data.werf),
    projectleiderId: idOf(data.projectleiderId ?? data.projectleider) || null,
    entiteitId: idOf(data.entiteitId ?? data.entiteit) || null,
    leverDatum: data.leverDatum,
    ophaalDatum: data.ophaalDatum || null,
    logistiekeReferentie: data.logistiekeReferentie,
    werkhoogte: data.werkhoogte === '' || data.werkhoogte == null ? null : Number(data.werkhoogte),
  }
}

export const verhuurApi = {
  list: (query = {}) => api.get(`${BASE}${queryString(query)}`),
  create: (data) => api.post(BASE, payload(data)),
  getById: (id) => api.get(`${BASE}/${encodeURIComponent(id)}`),
  update: (id, data) => api.put(`${BASE}/${encodeURIComponent(id)}`, {
    ...payload(data),
    status: data.status?.toUpperCase(),
  }),
  remove: (id) => api.del(`${BASE}/${encodeURIComponent(id)}`),
  vrijeToestellen: (query = {}) => {
    // Voor een bestaande verhuur neemt de backend de opgeslagen filters over.
    if (query.verhuurId) {
      return api.get(`${BASE}/${encodeURIComponent(query.verhuurId)}/vrije-assets`)
    }
    return api.get(`${BASE}/vrije-assets${queryString(query)}`)
  },
  assignToestel: ({ verhuurId, assetId, asset }) =>
    api.put(`${BASE}/${encodeURIComponent(verhuurId)}/asset`, {
      assetId: idOf(assetId ?? asset),
    }),
  unassignToestel: (verhuurId) =>
    api.del(`${BASE}/${encodeURIComponent(verhuurId)}/asset`),
  exportVerhuur: () => Promise.reject(new Error('PDF-export is nog niet beschikbaar')),
}
