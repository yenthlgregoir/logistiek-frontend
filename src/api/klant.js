import { api } from './client'

const BASE = '/renting/klant'

function unwrap(response) {
  return response &&
    typeof response === 'object' &&
    Object.hasOwn(response, 'data')
    ? response.data
    : response
}

function withId(value) {
  if (!value || typeof value !== 'object') return value

  const id = value.id ?? value._id
  return id == null ? { ...value } : { ...value, id, _id: id }
}

function normalizeKlant(value) {
  if (!value) return value

  return {
    ...withId(value),
    factuurAdres: withId(value.factuurAdres),
    leverAdressen: (value.leverAdressen ?? []).map(withId),
  }
}

function payload(value) {
  let result = value

  // Je bestaande formulier stuurt bij aanmaken een JSON-string.
  if (typeof result === 'string') {
    result = JSON.parse(result)
  }

  if (result instanceof FormData) {
    result = Object.fromEntries(result.entries())

    for (const field of ['factuurAdres', 'leverAdressen']) {
      if (typeof result[field] === 'string' && result[field] !== '') {
        result[field] = JSON.parse(result[field])
      }
    }
  }

  if (!result || typeof result !== 'object' || Array.isArray(result)) {
    throw new Error('Ongeldige klantgegevens.')
  }

  return result
}

function queryString(query) {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(query)) {
    if (value == null || value === '' || value === 'undefined') continue
    params.set(key, String(value))
  }

  return params.size ? `?${params}` : ''
}

function klantPath(id) {
  return `${BASE}/${encodeURIComponent(id)}`
}

async function klantResponse(request) {
  return normalizeKlant(unwrap(await request))
}

export const klantApi = {
  list: async (query = {}) => {
    const data = unwrap(
      await api.get(`${BASE}${queryString(query)}`)
    )

    const items = Array.isArray(data) ? data : data?.items

    if (!Array.isArray(items)) {
      throw new Error('Ongeldige klantenlijst ontvangen.')
    }

    return items.map(normalizeKlant)
  },

  get: (id) =>
    klantResponse(api.get(klantPath(id))),

  add: (data) =>
    klantResponse(api.post(BASE, payload(data))),

  update: (id, data) =>
    klantResponse(api.put(klantPath(id), payload(data))),

  remove: (id) =>
    api.del(klantPath(id)),

  addLeverAdres: (id, data) =>
    klantResponse(
      api.post(`${klantPath(id)}/leveradressen`, payload(data))
    ),

  removeLeverAdres: (id, adresId) =>
    klantResponse(
      api.del(
        `${klantPath(id)}/leveradressen/${encodeURIComponent(adresId)}`
      )
    ),

  updateLeverAdres: (id, adres) => {
    const data = payload(adres)
    const adresId = data.id ?? data._id

    if (!adresId) {
      throw new Error('Leveradres-ID ontbreekt.')
    }

    return klantResponse(
      api.put(
        `${klantPath(id)}/leveradressen/${encodeURIComponent(adresId)}`,
        data
      )
    )
  },
}