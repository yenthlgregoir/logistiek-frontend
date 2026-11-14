export function matchingMachines(machines, type, filters) {
  const constraints = [
    ['maxIngeklapteHoogte', 'ingeklapteHoogte', (actual, limit) => actual <= limit],
    ['maxBreedte', 'breedte', (actual, limit) => actual <= limit],
    ['minWerkhoogte', 'werkhoogte', (actual, limit) => actual >= limit],
    ['minHefvermogen', 'hefvermogen', (actual, limit) => actual >= limit],
  ]
  return machines.filter(
    (machine) =>
      (!type || type === 'both' || machine.type === type) &&
      constraints.every(([key, field, compare]) => {
        const raw = filters[key]
        if (raw == null || raw === '' || Number(raw) === 0) return true
        const limit = Number(raw)
        const value = machine[field]
        return (
          Number.isFinite(limit) &&
          limit > 0 &&
          value != null &&
          value !== '' &&
          Number.isFinite(Number(value)) &&
          Number(value) > 0 &&
          compare(Number(value), limit)
        )
      }),
  )
}
