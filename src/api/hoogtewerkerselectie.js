import { api } from './client'

export async function fetchHoogtewerkerSelectie() {
  const response = await api.get('/hoogtewerkerselectie')
  const rows = response?.data ?? response
  if (!Array.isArray(rows)) throw new Error('Ongeldig antwoord bij het laden van de hoogtewerkers.')
  return rows
}
