import { api } from './client'

const data = (response) => response?.data ?? response
async function list(request) {
  const value = data(await request)
  if (!Array.isArray(value)) throw new Error('Ongeldig antwoord bij toegangsbeheer.')
  return value
}
export const accessApi = {
  roles: () => list(api.get('/access/roles')),
  own: () => list(api.get('/access/requests')),
  request: async ({ role, reason }) => data(await api.post('/access/requests', { role, reason })),
  users: () => list(api.get('/admin/access/users')),
  requests: () => list(api.get('/admin/access/requests')),
  history: () => list(api.get('/admin/access/history')),
  grantAdmin: async (id, { reason }) =>
    data(await api.post('/admin/access/users/' + encodeURIComponent(id) + '/admin', { reason })),
  review: async (id, { revision, decision, note }) =>
    data(
      await api.post('/admin/access/requests/' + encodeURIComponent(id) + '/review', {
        revision,
        decision,
        note,
      }),
    ),
  revoke: async (id, { role, reason }) =>
    data(
      await api.post('/admin/access/users/' + encodeURIComponent(id) + '/revoke', { role, reason }),
    ),
}
