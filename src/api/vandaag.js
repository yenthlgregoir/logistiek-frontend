import { api } from './client'

export async function fetchVandaag() {
  const response = await api.get('/vandaag')
  const value = response?.data ?? response
  if (!value || !Array.isArray(value.acties) || !Array.isArray(value.modules) || !value.datum) {
    throw new Error('Het dagoverzicht heeft een ongeldig antwoord ontvangen.')
  }
  return value
}
