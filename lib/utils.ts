const POLISH_MONTHS = [
  'stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca',
  'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia',
]

const POLISH_MONTHS_NOMINATIVE = [
  'styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec',
  'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień',
]

/**
 * Format: "19 lutego"
 */
export function formatDayMonth(date: Date): string {
  const day = date.getDate()
  const month = POLISH_MONTHS[date.getMonth()]
  return `${day} ${month}`
}

/**
 * Format: "LUTY" (uppercase nominative)
 */
export function formatMonthNominative(date: Date): string {
  return POLISH_MONTHS_NOMINATIVE[date.getMonth()].toUpperCase()
}

/**
 * Parse "YYYY-MM-DD" or extract year from event date string
 */
export function extractYear(dateStr: string): number | null {
  const match = dateStr.match(/^(\d{4})-/)
  if (match) return parseInt(match[1], 10)
  return null
}

/**
 * Get MM-DD from a Date object, zero-padded
 */
export function getMonthDay(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${m}-${d}`
}

/**
 * Parse URL date param "MM-DD" back to month/day components
 */
export function parseMonthDay(mmdd: string): { month: number; day: number } | null {
  const match = mmdd.match(/^(\d{2})-(\d{2})$/)
  if (!match) return null
  return { month: parseInt(match[1], 10), day: parseInt(match[2], 10) }
}

/**
 * Create a Date object from month and day (current year)
 */
export function dateFromMonthDay(month: number, day: number): Date {
  return new Date(new Date().getFullYear(), month - 1, day)
}
