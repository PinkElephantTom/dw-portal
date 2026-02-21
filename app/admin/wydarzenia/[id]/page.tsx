import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft } from 'lucide-react'
import EditEventForm from '@/components/admin/EditEventForm'
import PhotoManager from '@/components/admin/PhotoManager'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  return { title: `Edycja wydarzenia #${id} — Admin` }
}

export default async function EditEventPage({ params }: Props) {
  const { id } = await params
  const eventId = Number(id)

  if (isNaN(eventId)) notFound()

  const supabase = await createClient()

  const { data: event, error } = await supabase
    .from('dw_events')
    .select('id, description, event_date, photos:dw_photos(id, url, title, author, source)')
    .eq('id', eventId)
    .single()

  if (error || !event) notFound()

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <Link
          href="/admin/wydarzenia"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#b50926] transition-colors mb-3"
        >
          <ArrowLeft size={14} />
          Powrót do listy
        </Link>
        <h1 className="font-heading text-2xl font-bold text-[#1d1d1b]">
          Edycja wydarzenia <span className="text-gray-400">#{event.id}</span>
        </h1>
      </div>

      {/* Event form */}
      <EditEventForm
        eventId={event.id}
        initialDate={event.event_date}
        initialDescription={event.description}
      />

      {/* Photo management */}
      <div className="mt-8">
        <h2 className="font-heading text-lg font-bold text-[#1d1d1b] mb-4 border-b border-gray-200 pb-2">
          Zdjęcia ({Array.isArray(event.photos) ? event.photos.length : 0})
        </h2>
        <PhotoManager
          eventId={event.id}
          photos={Array.isArray(event.photos) ? event.photos : []}
        />
      </div>
    </div>
  )
}
