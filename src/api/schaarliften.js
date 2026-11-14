import { api } from './client'

const BASE = '/hoogtewerkers'
const TYPES = '/machinetypes'

export const schaarliftenApi = {
  list: async (query = {}) => {
    const response = await api.get(BASE)

    // De backend ondersteunt zoeken nog niet; filter voorlopig lokaal.
    const search = String(query.search ?? '').trim().toLowerCase()

    return {
      ...response,
      data: search
        ? response.data.filter((item) =>
            item.nummer?.toLowerCase().includes(search),
          )
        : response.data,
    }
  },

  create: (data) => api.post(BASE, data),

  update: (id, data) =>
    api.put(`${BASE}/${encodeURIComponent(id)}`, data),

  getTypes: async () => {
    const response = await api.get(TYPES)

    return {
      ...response,
      data: response.data.filter((type) =>
        ['Schaarlift', 'Knikarm'].includes(type.type),
      ),
    }
  },

  createType: (data) => api.post(TYPES, data),

 toPdf: () =>
  api.get(`${BASE}/pdf`, {
    responseType: 'blob',
  }),
}