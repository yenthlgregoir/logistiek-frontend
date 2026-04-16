export function formatDate(date: string | Date | null): string | null {
  if (!date) return null

  return new Date(date).toLocaleDateString('nl-BE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}