import type { MetadataRoute } from 'next'

const BASE_URL = 'https://d-w.pl'

/**
 * Generate all MM-DD combinations for the calendar (366 days including Feb 29)
 */
function getAllDates(): string[] {
  const dates: string[] = []
  // Use a leap year (2024) to include Feb 29
  const year = 2024
  for (let month = 0; month < 12; month++) {
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    for (let day = 1; day <= daysInMonth; day++) {
      const mm = String(month + 1).padStart(2, '0')
      const dd = String(day).padStart(2, '0')
      dates.push(`${mm}-${dd}`)
    }
  }
  return dates
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static entries: homepage + all 366 daily pages
  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    ...getAllDates().map((mmdd) => ({
      url: `${BASE_URL}/?data=${mmdd}`,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
  ]

  // Dynamic entries: all events from Supabase
  let eventEntries: MetadataRoute.Sitemap = []

  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('dw_events')
      .select('id, updated_at')
      .order('id', { ascending: true })

    if (!error && data) {
      eventEntries = data.map((event: { id: number; updated_at?: string }) => ({
        url: `${BASE_URL}/wydarzenie/${event.id}`,
        lastModified: event.updated_at ? new Date(event.updated_at) : undefined,
        changeFrequency: 'yearly' as const,
        priority: 0.6,
      }))
    }
  } catch {
    // Supabase not configured — return only static entries
  }

  return [...staticEntries, ...eventEntries]
}
