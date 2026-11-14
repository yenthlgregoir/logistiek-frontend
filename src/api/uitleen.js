import { api } from './client'

export const toolsKeuzeApi = {
  werven: () => api.get('/tools/keuzes/werven'),
  projectleiders: () => api.get('/tools/keuzes/projectleiders'),
}

function data(response) {
  return response && typeof response === 'object' && Object.hasOwn(response, 'data')
    ? response.data
    : response
}

function withId(value) {
  if (!value || typeof value !== 'object') return value
  const id = value.id ?? value._id
  return id == null ? { ...value } : { ...value, id, _id: id }
}

function material(value) { return withId(value) }
function loan(value) {
  if (!value) return value
  return {
    ...withId(value),
    regels: (value.regels ?? []).map(withId),
    retouren: (value.retouren ?? []).map(withId),
  }
}

function day(value) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const parsed = new Date(value + 'T00:00:00Z')
    if (Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value) return value
  } else if (value instanceof Date && Number.isFinite(value.getTime())) {
    return [value.getFullYear(), String(value.getMonth() + 1).padStart(2, '0'),
      String(value.getDate()).padStart(2, '0')].join('-')
  }
  throw new Error('Gebruik een geldige kalenderdatum.')
}

function query(values = {}) {
  const result = new URLSearchParams()
  for (const [key, original] of Object.entries(values)) {
    let value = original
    if (value && typeof value === 'object' && !(value instanceof Date)) value = value.id ?? value._id
    if (value == null || value === '' || ['null', 'undefined', 'all'].includes(value)) continue
    if (key === 'van' || key === 'tot') value = day(value)
    result.set(key, String(value))
  }
  return result.size ? `?${result}` : ''
}

function path(base, value) {
  const id = value && typeof value === 'object' ? value.id ?? value._id : value
  if (id == null || id === '') throw new Error('ID ontbreekt.')
  return `${base}/${encodeURIComponent(id)}`
}

function loanPayload(value) {
  return {
    ...value,
    startDatum: day(value.startDatum),
    verwachteEindDatum: value.verwachteEindDatum ? day(value.verwachteEindDatum) : null,
  }
}

async function materialsResponse(request) {
  const rows = data(await request)
  if (!Array.isArray(rows)) throw new Error('Ongeldige materiaallijst ontvangen.')
  return rows.map(material)
}
async function loansResponse(request) {
  const rows = data(await request)
  if (!Array.isArray(rows)) throw new Error('Ongeldige uitleenlijst ontvangen.')
  return rows.map(loan)
}

const MATERIALEN = '/tools/materialen'
const UITLEEN = '/tools/uitleen'

export const materiaalApi = {
  list: (filters = {}) => materialsResponse(api.get(MATERIALEN + query(filters))),
  get: async id => material(data(await api.get(path(MATERIALEN, id)))),
  create: async value => material(data(await api.post(MATERIALEN, value))),
  update: async (id, value) => material(data(await api.put(path(MATERIALEN, id), value))),
  voorraadCorrectie: async (id, value) =>
    material(data(await api.post(`${path(MATERIALEN, id)}/voorraadcorrecties`, value))),
  beschikbaarheid: async (id, filters = {}) =>
    data(await api.get(`${path(MATERIALEN, id)}/beschikbaarheid${query(filters)}`)),
  historiek: id => loansResponse(api.get(`${path(MATERIALEN, id)}/historiek`)),
}

export const uitleenApi = {
  list: (filters = {}) => loansResponse(api.get(UITLEEN + query(filters))),
  get: async id => loan(data(await api.get(path(UITLEEN, id)))),
  create: async value => loan(data(await api.post(UITLEEN, loanPayload(value)))),
  update: async (id, value) => loan(data(await api.put(path(UITLEEN, id), loanPayload(value)))),
  uitgeven: async id => loan(data(await api.post(`${path(UITLEEN, id)}/uitgeven`, {}))),
  retour: async (id, value) => loan(data(await api.post(`${path(UITLEEN, id)}/retouren`, value))),
  annuleren: async id => loan(data(await api.post(`${path(UITLEEN, id)}/annuleren`, {}))),
  verwachteRetour: async (id, datum, permanent = false) =>
    loan(data(await api.patch(`${path(UITLEEN, id)}/verwachte-retour`, {
      datum: datum ? day(datum) : null, permanent,
    }))),
}
