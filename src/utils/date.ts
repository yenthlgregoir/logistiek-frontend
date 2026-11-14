export function formatDate(value: string | Date | null): string | null {
  if (!value) return null

  if (typeof value === 'string') {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)

    if (match) {
      const [, year, month, day] = match
      return `${day}/${month}/${year}`
    }
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  return date.toLocaleDateString('nl-BE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}