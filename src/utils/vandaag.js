export const moduleLabels = { renting: 'Renting', logistics: 'Logistiek', tools: 'Tools' }
export const actionLabels = {
  leveren: 'Leveren / uitgeven',
  ophalen: 'Ophalen / retour',
  toewijzen: 'Geen toestel',
}

export function actionTarget(action) {
  const query =
    action.module === 'tools'
      ? { uitleen: action.recordId }
      : action.module === 'renting'
        ? { boeking: action.recordId }
        : { verhuur: action.recordId }
  return { path: action.pad, query }
}
export function filterActions(
  actions,
  { module = '', kind = '', overdue = false, search = '' } = {},
) {
  const term = search.trim().toLocaleLowerCase('nl-BE')
  return actions.filter(
    (action) =>
      (!module || action.module === module) &&
      (!kind || action.soort === kind) &&
      (!overdue || action.achterstallig) &&
      (!term ||
        [action.referentie, action.bestemming, action.materiaal, action.label].some((value) =>
          String(value ?? '')
            .toLocaleLowerCase('nl-BE')
            .includes(term),
        )),
  )
}
export function dateLabel(value) {
  if (!value) return '-'
  const date = new Date(value + 'T00:00:00Z')
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat('nl-BE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'UTC',
      }).format(date)
    : '-'
}
