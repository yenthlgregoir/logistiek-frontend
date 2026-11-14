export const roleLabels = {
  purchase: 'Purchase',
  renting: 'Renting',
  logistics: 'Logistiek',
  tools: 'Tools',
  admin: 'Beheerder',
}
export const requestLabels = {
  PENDING: 'In behandeling',
  APPROVED: 'Goedgekeurd',
  REJECTED: 'Afgewezen',
}
export const auditLabels = {
  REQUESTED: 'Aangevraagd',
  APPROVED: 'Goedgekeurd',
  REJECTED: 'Afgewezen',
  REVOKED: 'Ingetrokken',
  ADMIN_GRANTED: 'Adminrechten toegekend',
}
export function hasModule(roles = [], role) {
  return roles.includes('admin') || roles.includes(role)
}
export function stamp(value) {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat('nl-BE', {
        timeZone: 'Europe/Brussels',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date)
    : '-'
}
