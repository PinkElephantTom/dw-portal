import Link from 'next/link'
import { notFound } from 'next/navigation'
import { extractYear, formatDayMonth, getMonthDay } from '@/lib/utils'
import PhotoGallery from '@/components/PhotoGallery'
import type { Metadata } from 'next'

interface Photo {
  id: number
  url: string
  title: string | null
  author: string | null
  source: string | null
}

interface DwEvent {
  id: number
  description: string
  event_date: string
  photos?: Photo[]
}

interface Props {
  params: Promise<{ id: string }>
}

async function getEvent(id: number): Promise<DwEvent | null> {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('dw_events')
      .select('*, photos:dw_photos(*)')
      .eq('id', id)
      .single()

    if (error || !data) return null
    return data as DwEvent
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const event = await getEvent(Number(id))
  if (!event) return { title: 'Nie znaleziono' }

  const year = extractYear(event.event_date)
  const desc = event.description.slice(0, 160)

  return {
    title: year ? `${year} — ${desc}` : desc,
    description: event.description.slice(0, 300),
  }
}

export default async function EventPage({ params }: Props) {
  const { id } = await params
  const event = await getEvent(Number(id))

  if (!event) {
    notFound()
  }

  const year = extractYear(event.event_date)
  const photos = event.photos || []

  // Parse date for "back to this day" link
  const dateMatch = event.event_date.match(/-(\d{2}-\d{2})$/)
  const mmdd = dateMatch ? dateMatch[1] : null
  const dateObj = mmdd
    ? new Date(2024, parseInt(mmdd.split('-')[0]) - 1, parseInt(mmdd.split('-')[1]))
    : null

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-gray-500">
        <Link href="/" className="hover:text-[#b50926] transition-colors">Kalendarium</Link>
        {mmdd && dateObj && (
          <>
            <span className="mx-2">›</span>
            <Link href={`/?data=${mmdd}`} className="hover:text-[#b50926] transition-colors">
              {formatDayMonth(dateObj)}
            </Link>
          </>
        )}
        <span className="mx-2">›</span>
        <span className="text-gray-700">Wydarzenie #{id}</span>
      </nav>

      {/* Event content */}
      <article className="bg-white rounded-sm border border-gray-200 overflow-hidden">
        <div className="p-6 md:p-8">
          {/* Year */}
          {year && (
            <p className="font-heading text-4xl md:text-5xl font-bold text-[#b50926] mb-4">
              {year}
            </p>
          )}

          {/* Description */}
          <div className="prose max-w-none text-gray-800 text-base md:text-lg leading-relaxed">
            <p>{event.description}</p>
          </div>

          {/* Photo gallery */}
          {photos.length > 0 && (
            <div className="mt-8">
              <h2 className="font-heading text-lg font-bold uppercase tracking-wider text-[#1d1d1b] border-b-2 border-[#b50926] pb-1 mb-4">
                Galeria
              </h2>
              <PhotoGallery photos={photos} />
            </div>
          )}
        </div>
      </article>

      {/* Back link */}
      <div className="mt-6 text-center">
        {mmdd ? (
          <Link
            href={`/?data=${mmdd}`}
            className="inline-flex items-center px-6 py-2.5 bg-[#b50926] hover:bg-[#8f071e] text-white transition-colors text-xs font-heading font-semibold uppercase tracking-wider"
          >
            ← Powrót do {dateObj ? formatDayMonth(dateObj) : 'kalendarium'}
          </Link>
        ) : (
          <Link
            href="/"
            className="inline-flex items-center px-6 py-2.5 bg-[#b50926] hover:bg-[#8f071e] text-white transition-colors text-xs font-heading font-semibold uppercase tracking-wider"
          >
            ← Powrót do kalendarium
          </Link>
        )}
      </div>
    </div>
  )
}
