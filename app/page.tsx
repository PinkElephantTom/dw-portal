import Link from 'next/link'
import { formatDayMonth, formatMonthNominative, getMonthDay, parseMonthDay, dateFromMonthDay } from '@/lib/utils'
import CalendarWidget from '@/components/CalendarWidget'
import EventItem from '@/components/EventItem'

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
    // Supabase not configured yet
  }

  // Previous / next day links
  const prevDate = new Date(displayDate)
  prevDate.setDate(prevDate.getDate() - 1)
  const nextDate = new Date(displayDate)
  nextDate.setDate(nextDate.getDate() + 1)

  const prevLink = `/?data=${getMonthDay(prevDate)}`
  const nextLink = `/?data=${getMonthDay(nextDate)}`

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Date header */}
      <div className="text-center mb-8">
        <h1 className="font-heading text-sm font-semibold uppercase tracking-widest text-gray-500 mb-1">
          Kalendarium Południowej Wielkopolski
        </h1>
        <div className="flex items-center justify-center gap-4 mb-2">
          <Link
            href={prevLink}
            className="text-3xl text-gray-300 hover:text-[#b50926] transition-colors leading-none"
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
            className="text-3xl text-gray-300 hover:text-[#b50926] transition-colors leading-none"
            aria-label="Następny dzień"
          >
            ›
          </Link>
        </div>
        <p className="text-sm text-gray-500">
          Wydarzenia historyczne z dnia {dayMonthFull}
        </p>
      </div>

      {/* Main content: events (left) + calendar sidebar (right) */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Events — left column */}
        <div className="flex-1 min-w-0 space-y-6">
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

        {/* Sidebar — right column (calendar + contact) */}
        <aside className="lg:w-[280px] shrink-0 space-y-6">
          {/* Calendar widget */}
          <CalendarWidget currentDate={displayDate} />

          {/* Contact box */}
          <div className="bg-white rounded-sm border border-gray-200 p-4">
            <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-[#1d1d1b] mb-2">
              Kontakt
            </h3>
            <p className="text-sm text-gray-500">
              e-mail:{' '}
              <a
                href="mailto:kalendarium.pld.wlkp@gmail.com"
                className="text-[#b50926] hover:text-[#8f071e] transition-colors break-all"
              >
                kalendarium.pld.wlkp@gmail.com
              </a>
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
