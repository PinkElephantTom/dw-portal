import Link from 'next/link'
import { formatDayMonth, formatMonthNominative, getMonthDay, parseMonthDay, dateFromMonthDay, extractYear } from '@/lib/utils'
import DatePicker from '@/components/DatePicker'
import EventItem from '@/components/EventItem'

// Supabase — will be connected after migration
// import { createClient } from '@/lib/supabase/server'

interface DwEvent {
  id: number
  description: string
  event_date: string
  photos?: { id: number; url: string; title: string | null; author: string | null; source: string | null }[]
}

interface Props {
  searchParams: Promise<{ data?: string }>
}

export default async function HomePage({ searchParams }: Props) {
  const params = await searchParams

  // Determine which date to display
  let displayDate: Date
  if (params.data) {
    const parsed = parseMonthDay(params.data)
    if (parsed) {
      displayDate = dateFromMonthDay(parsed.month, parsed.day)
    } else {
      displayDate = new Date()
    }
  } else {
    displayDate = new Date()
  }

  const mmdd = getMonthDay(displayDate)
  const dayNum = displayDate.getDate()
  const monthName = formatMonthNominative(displayDate)
  const dayMonthFull = formatDayMonth(displayDate)

  // ====== Fetch events from Supabase ======
  let events: DwEvent[] = []

  try {
    // Dynamic import to avoid build errors when env vars aren't set
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('dw_events')
      .select('*, photos:dw_photos(*)')
      .like('event_date', `%-${mmdd}`)
      .order('event_date', { ascending: true })

    if (!error && data) {
      events = data as DwEvent[]
    }
  } catch {
    // Supabase not configured yet — show empty state
  }

  // Calculate previous and next day links
  const prevDate = new Date(displayDate)
  prevDate.setDate(prevDate.getDate() - 1)
  const nextDate = new Date(displayDate)
  nextDate.setDate(nextDate.getDate() + 1)

  const prevLink = `/?data=${getMonthDay(prevDate)}`
  const nextLink = `/?data=${getMonthDay(nextDate)}`

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Date header */}
      <div className="text-center mb-8">
        <h1 className="font-heading text-sm font-semibold uppercase tracking-widest text-gray-500 mb-1">
          Kalendarium Południowej Wielkopolski
        </h1>
        <div className="flex items-center justify-center gap-4 mb-2">
          <Link
            href={prevLink}
            className="text-2xl text-gray-400 hover:text-[#b50926] transition-colors"
            aria-label="Poprzedni dzień"
          >
            ‹
          </Link>
          <div>
            <p className="font-heading text-5xl md:text-6xl font-bold text-[#b50926] leading-none">
              {dayNum}
            </p>
            <p className="font-heading text-xl md:text-2xl font-semibold uppercase tracking-wider text-[#1d1d1b]">
              {monthName}
            </p>
          </div>
          <Link
            href={nextLink}
            className="text-2xl text-gray-400 hover:text-[#b50926] transition-colors"
            aria-label="Następny dzień"
          >
            ›
          </Link>
        </div>
        <p className="text-sm text-gray-500">
          Wydarzenia historyczne z dnia {dayMonthFull}
        </p>
      </div>

      {/* Events list */}
      <div className="space-y-6 mb-10">
        {events.length > 0 ? (
          events.map((event) => (
            <EventItem key={event.id} event={event} />
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-sm border border-gray-200">
            <p className="text-gray-500 text-lg mb-2">Brak wydarzeń dla tego dnia</p>
            <p className="text-gray-400 text-sm">
              Dane zostaną zaimportowane z oryginalnej bazy d-w.pl
            </p>
          </div>
        )}
      </div>

      {/* Date picker section */}
      <div className="bg-white rounded-sm border border-gray-200 p-6 text-center">
        <h2 className="font-heading text-lg font-bold uppercase tracking-wider text-[#1d1d1b] mb-4">
          Wybierz inną datę
        </h2>
        <DatePicker currentDate={displayDate} />
      </div>
    </div>
  )
}
