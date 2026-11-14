export const loanStatuses = {
  GERESERVEERD: 'Gereserveerd',
  UITGELEEND: 'Uitgeleend',
  DEELS_TERUG: 'Deels retour',
  TERUG: 'Retour',
  GEANNULEERD: 'Geannuleerd',
}
export const materialStatuses = {
  ACTIEF: 'Actief',
  DEFECT: 'Defect',
  INCOMPLEET: 'Incompleet',
  VERMIST: 'Vermist',
  BUITENDIENST: 'Buiten dienst',
}
export const idOf = (value) =>
  value && typeof value === 'object' ? (value.id ?? value._id) : value
export const isOpen = (loan) => ['GERESERVEERD', 'UITGELEEND', 'DEELS_TERUG'].includes(loan?.status)
export const isIssued = (loan) => ['UITGELEEND', 'DEELS_TERUG'].includes(loan?.status)
export const isQuantity = (material) => material?.beheerwijze === 'AANTAL'
export const statusLabel = (value) =>
  loanStatuses[value] ?? materialStatuses[value] ?? value ?? 'Onbekend'
export const errorMessage = (error, fallback = 'De actie is mislukt.') =>
  error?.response?.data?.message || error?.message || fallback
export const number = (value) => new Intl.NumberFormat('nl-BE').format(value ?? 0)
export function today() {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Brussels' }).format(new Date())
}
export function formatDate(value) {
  if (!value) return '-'
  const plain = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
  const date = new Date(plain ? value + 'T00:00:00Z' : value)
  if (!Number.isFinite(date.getTime())) return '-'
  return new Intl.DateTimeFormat('nl-BE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: plain ? 'UTC' : 'Europe/Brussels',
  }).format(date)
}
export function period(loan) {
  return `${formatDate(loan.startDatum)} - ${loan.permanent ? 'Permanent' : loan.verwachteEindDatum ? formatDate(loan.verwachteEindDatum) : 'Zonder einddatum'}`
}
export function whole(value, min = 0) {
  return (
    Number.isSafeInteger(Number(value)) && value !== '' && value != null && Number(value) >= min
  )
}
export function validateReturn(loan, rows) {
  const selected = rows.filter((row) => Number(row.aantal) > 0)
  if (!selected.length) return 'Vul bij minstens één materiaal een retouraantal in.'
  for (const row of rows) {
    if (!whole(row.aantal) || !whole(row.beschadigdAantal))
      return 'Gebruik volledige, positieve aantallen of nul.'
    const original = loan.regels.find((line) => idOf(line) === row.regelId)
    const remaining = Number(original?.openstaandAantal ?? -1)
    if (!original || Number(row.aantal) > remaining)
      return 'Een retouraantal is groter dan wat nog openstaat.'
    if (Number(row.beschadigdAantal) > Number(row.aantal))
      return 'Beschadigd aantal mag niet groter zijn dan het retouraantal.'
  }
  return ''
}
export function planningBookings(loans, materials) {
  const items = new Map(materials.map((item) => [idOf(item), item]))
  return loans.filter(isOpen).flatMap((loan) =>
    loan.regels
      .filter((line) => line.openstaandAantal > 0)
      .map((line) => {
        const item = items.get(line.materiaalId)
        const issued = isIssued(loan)
        const start =
          issued && loan.uitgegevenOp
            ? new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Brussels' }).format(
                new Date(loan.uitgegevenOp),
              )
            : loan.startDatum
        return {
          id: idOf(loan),
          lineId: idOf(line),
          item: line.materiaalId,
          status: loan.achterstallig ? 'ACHTERSTALLIG' : loan.status,
          start,
          end: issued ? null : loan.verwachteEindDatum,
          title: `${line.openstaandAantal} × · ${loan.ontlener} · ${loan.locatie || loan.werfNaam || ''}`,
          openEndedLabel: issued
            ? 'Nog niet retour'
            : loan.permanent
              ? 'Permanent'
              : 'Zonder einddatum',
          materiaal: item,
        }
      }),
  )
}
