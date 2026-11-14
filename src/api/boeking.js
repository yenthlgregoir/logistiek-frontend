import { api } from './client'

const BASE = '/renting/boekingen'

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
  const text = String(value ?? '').trim()
  return (
    {
      AANGEVRAAGD: 'Aangevraagd',
      BEVESTIGD: 'Bevestigd',
      LEVEREN: 'Leveren',
      GELEVERD: 'Geleverd',
      OPGEHAALD: 'Opgehaald',
      AFGEWERKT: 'Afgewerkt',
      ACTIEF: 'Actief',
      KAPOT: 'Kapot',
    }[text.toUpperCase()] ?? text
  )
}

function transportLabel(value) {
  return (
    {
      TRANSPORT_DOOR_LOGISTIEK: 'Transport door logistiek',
      OPHALING_DOOR_KLANT: 'ophaling door klant',
    }[value] ?? value
  )
}

function normalizeKlant(value) {
  if (!value || typeof value !== 'object') return value
  return {
    ...withId(value),
    factuurAdres: withId(value.factuurAdres),
    leverAdressen: (value.leverAdressen ?? []).map(withId),
  }
}

function normalizeToestel(value) {
  if (!value || typeof value !== 'object') return value
  return {
    ...withId(value),
    Ref: value.Ref ?? value.ref,
    chasisnummer: value.chasisnummer ?? value.chassisnummer,
    type: withId(value.type),
    klant: withId(value.klant),
    gnw: withId(value.gnw),
    status: value.status
      ? { ...value.status, statusType: statusLabel(value.status.statusType) }
      : null,
  }
}

function normalizeBoeking(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Ongeldige boeking ontvangen.')
  }
  return {
    ...withId(value),
    status: statusLabel(value.status),
    type: transportLabel(value.type),
    toestelType: withId(value.toestelType),
    toestel: normalizeToestel(value.toestel),
    klant: normalizeKlant(value.klant),
    leverAdresDetails: withId(value.leverAdresDetails),
  }
}

function filterValue(value) {
  return value && typeof value === 'object'
    ? (value.id ?? value._id ?? value.value ?? value.naam)
    : value
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
    let value = ['type', 'klant', 'status', 'toestelType'].includes(key)
      ? filterValue(original)
      : original
    if (value == null || value === '' || ['undefined', 'null', 'all'].includes(value)) continue
    if (['startDatum', 'beginDatum', 'eindDatum'].includes(key)) value = calendarDate(value)
    params.set(key, String(value))
  }
  return params.size ? `?${params}` : ''
}

function path(id) {
  return `${BASE}/${encodeURIComponent(id)}`
}

export const boekingApi = {
  list: async (query = {}) => {
    const data = unwrap(await api.get(`${BASE}${queryString(query)}`))
    const items = Array.isArray(data) ? data : data?.items
    if (!Array.isArray(items)) throw new Error('Ongeldige boekingenlijst ontvangen.')
    return items.map(normalizeBoeking)
  },

  get: async (id) => normalizeBoeking(unwrap(await api.get(path(id)))),

  add: (value) => bookingResponse(api.post(BASE, createPayload(value))),

  update: (id, data) => bookingResponse(api.patch(path(id), updatePayload(data))),
  remove: (id) => api.del(path(id)),
  changeState: (id, state) =>
    bookingResponse(
      api.patch(`${path(id)}/status`, {
        status: typeof state === 'string' ? state : state.status,
      }),
    ),

  vrijeToestellen: async ({ boekingId, beginDatum, eindDatum, toestelType } = {}) => {
    const url = boekingId
      ? `${path(boekingId)}/vrije-toestellen`
      : `${BASE}/toestellen/vrij${periodQuery({ beginDatum, eindDatum, toestelType })}`
    const data = unwrap(await api.get(url))
    if (!Array.isArray(data)) throw new Error('Ongeldige lijst vrije toestellen ontvangen.')
    return data.map(normalizeToestel)
  },

  beschikbareToestellen: async ({ beginDatum, eindDatum, toestelType } = {}) =>
    unwrap(
      await api.get(
        `${BASE}/toestellen/beschikbaar/aantal${periodQuery({
          beginDatum,
          eindDatum,
          toestelType,
        })}`,
      ),
    ),

  assignToestel: (boekingId, toestelId) =>
    bookingResponse(
      api.patch(`${path(boekingId)}/toestellen/assign`, {
        toestel: filterValue(toestelId),
      }),
    ),

  updatePeriode: (boekingId, beginDatum, eindDatum) =>
    bookingResponse(
      api.patch(`${BASE}/periode/update`, {
        boekingId,
        beginDatum: periodValue(beginDatum),
        eindDatum: periodValue(eindDatum),
      }),
    ),

  exportPdf: (id) => api.get(`${path(id)}/pdf`, { responseType: 'blob' }),
}

async function bookingResponse(request) {
  return normalizeBoeking(unwrap(await request))
}

function periodValue(value) {
  if (value == null || value === '') throw new Error('Begin- en einddatum zijn verplicht.')
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return calendarDate(value)
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) throw new Error('Ongeldige datum.')
  return date.toISOString()
}

function periodQuery({ beginDatum, eindDatum, toestelType }) {
  const params = new URLSearchParams({
    beginDatum: periodValue(beginDatum),
    eindDatum: periodValue(eindDatum),
  })
  const type = filterValue(toestelType)
  if (type && !['null', 'undefined', 'all'].includes(type)) params.set('toestelType', String(type))
  return `?${params}`
}

function updatePayload(value) {
  const data = typeof value === 'string' ? JSON.parse(value) : value
  if (!data || typeof data !== 'object' || Array.isArray(data))
    throw new Error('Ongeldige boekingsgegevens.')
  const result = {}
  for (const key of [
    'beginDatum',
    'eindDatum',
    'toestelType',
    'klant',
    'leverAdres',
    'type',
    'comment',
    'status',
  ]) {
    if (!Object.hasOwn(data, key) || data[key] === undefined) continue
    result[key] = ['toestelType', 'klant', 'leverAdres'].includes(key)
      ? filterValue(data[key])
      : data[key]
    if (key === 'beginDatum' || key === 'eindDatum') result[key] = periodValue(data[key])
  }
  return result
}

function createPayload(value) {
  const data = typeof value === 'string' ? JSON.parse(value) : value
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Ongeldige boekingsgegevens.')
  }
  return {
    beginDatum: periodValue(data.beginDatum),
    eindDatum: data.eindDatum ? periodValue(data.eindDatum) : null,
    toestelType: filterValue(data.toestelType),
    klant: filterValue(data.klant),
    leverAdres: filterValue(data.leverAdres) || null,
    type: data.type,
    comment: data.comment || null,
  }
}
