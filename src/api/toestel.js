import { api } from './client'

const BASE = '/renting/toestellen'

function unwrap(response) {
  return response && typeof response === 'object' && Object.hasOwn(response, 'data')
    ? response.data
    : response
}

function withId(value) {
  if (!value || typeof value !== 'object') return value
  const id = value.id ?? value._id
  return id == null ? { ...value } : { ...value, id, _id: id }
}

function statusLabel(value) {
  const label = String(value ?? '').trim()
  return { ACTIEF: 'Actief', KAPOT: 'Kapot' }[label.toUpperCase()] ?? label
}

function normalizeToestel(value) {
  if (!value) return value
  return {
    ...withId(value),
    Ref: value.Ref ?? value.ref,
    chasisnummer: value.chasisnummer ?? value.chassisnummer,
    type: withId(value.type),
    klant: withId(value.klant),
    status: value.status
      ? { ...value.status, statusType: statusLabel(value.status.statusType) }
      : null,
    gnw: withId(value.gnw) ?? (value.toegewezen ? { naam: 'Toegewezen' } : 'vrij'),
  }
}

function idOrName(value) {
  return value && typeof value === 'object' ? (value.id ?? value._id ?? value.naam) : value
}

function calendarDate(value) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const date = new Date(value + 'T00:00:00Z')
    if (Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value) return value
    throw new Error('Ongeldige filterdatum.')
  }
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) throw new Error('Ongeldige filterdatum.')
  return [
    String(date.getFullYear()).padStart(4, '0'),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

function queryString(query) {
  const params = new URLSearchParams()
  for (const [key, original] of Object.entries(query)) {
    let value = original
    if (key === 'type' || key === 'klant') value = idOrName(value)
    if (value == null || value === '' || ['undefined', 'null', 'all'].includes(value)) continue
    if (key === 'beginDatum' || key === 'eindDatum') value = calendarDate(value)
    params.set(key, String(value))
  }
  return params.size ? `?${params}` : ''
}

function statusPayload(value) {
  if (typeof value === 'string') return { statusType: value }
  if (!value || typeof value !== 'object') return undefined

  const result = {}
  if (value.statusType != null && value.statusType !== '') result.statusType = value.statusType
  for (const key of ['beginDatum', 'eindDatum']) {
    if (value[key] == null || value[key] === '') continue
    const raw = value[key]
    const date =
      typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw)
        ? new Date(raw + 'T00:00:00')
        : new Date(raw)
    if (!Number.isFinite(date.getTime())) throw new Error('Ongeldige statusdatum.')
    result[key] = date.toISOString()
  }
  return result
}

function payload(data) {
  return {
    typeId: idOrName(data.typeId ?? data.type),
    Ref: data.Ref ?? data.ref,
    nrplaat: data.nrplaat,
    chasisnummer: data.chasisnummer ?? data.chassisnummer,
    status: statusPayload(data.status),
  }
}

function path(id) {
  return `${BASE}/${encodeURIComponent(id)}`
}

async function toestelResponse(request) {
  return normalizeToestel(unwrap(await request))
}

function changeStatus(id, value) {
  const data = statusPayload(value)
  if (!data?.statusType) throw new Error('Status is verplicht.')
  return toestelResponse(api.patch(`${path(id)}/status`, data))
}

export const toestelApi = {
  bookings: async (id, query = {}) =>
    unwrap(await api.get(`${path(id)}/boekingen${queryString(query)}`)),
  bookingsPdf: (id, query = {}) =>
    api.get(`${path(id)}/boekingen/pdf${queryString(query)}`, { responseType: 'blob' }),
  list: async (query = {}) => {
    const data = unwrap(await api.get(`${BASE}${queryString(query)}`))
    const items = Array.isArray(data) ? data : data?.items
    if (!Array.isArray(items)) throw new Error('Ongeldige toestellenlijst ontvangen.')
    return { items: items.map(normalizeToestel) }
  },
  get: (id) => toestelResponse(api.get(path(id))),
  getById: (id) => toestelResponse(api.get(path(id))),
  create: (data) => toestelResponse(api.post(BASE, payload(data))),
  update: (id, data) => toestelResponse(api.patch(path(id), payload(data))),
  remove: (id) => api.del(path(id)),
  getTypes: async () => {
    const data = unwrap(await api.get(`${BASE}/types`))
    const types = Array.isArray(data) ? data : data?.types
    if (!Array.isArray(types)) throw new Error('Ongeldige typelijst ontvangen.')
    return { types: types.map(withId) }
  },
  createType: async (naam) => withId(unwrap(await api.post(`${BASE}/types`, { naam }))),
  changeStatus,
  updateStatus: changeStatus,
}
