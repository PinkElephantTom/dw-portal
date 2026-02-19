import Image from 'next/image'
import Link from 'next/link'
import { extractYear } from '@/lib/utils'

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

export default function EventItem({ event }: { event: DwEvent }) {
  const year = extractYear(event.event_date)
  const photos = event.photos || []

  return (
    <article className="bg-white rounded-sm border border-gray-200 overflow-hidden">
      <div className="p-4 md:p-6">
        {/* Year badge + description */}
        <div className="flex gap-4">
          {year && (
            <div className="shrink-0">
              <span className="inline-block font-heading text-2xl md:text-3xl font-bold text-[#b50926]">
                {year}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-gray-800 text-sm md:text-base leading-relaxed">
              {event.description}
            </p>
          </div>
        </div>

        {/* Photos grid */}
        {photos.length > 0 && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {photos.map((photo) => (
              <div key={photo.id} className="relative aspect-square bg-gray-100 rounded-sm overflow-hidden group">
                <Image
                  src={photo.url}
                  alt={photo.title || 'Zdjęcie archiwalne'}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                />
                {photo.title && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
                    <p className="text-white text-[10px] line-clamp-2">{photo.title}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Photo credits */}
        {photos.length > 0 && photos.some(p => p.author || p.source) && (
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {photos.filter(p => p.author || p.source).map((photo) => (
              <p key={photo.id} className="text-[10px] text-gray-400">
                {photo.author && <>fot. {photo.author}</>}
                {photo.author && photo.source && <> / </>}
                {photo.source && <>{photo.source}</>}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Link to detail page */}
      <div className="border-t border-gray-100 px-4 md:px-6 py-2">
        <Link
          href={`/wydarzenie/${event.id}`}
          className="text-xs text-[#b50926] hover:text-[#8f071e] font-heading uppercase tracking-wide transition-colors"
        >
          Zobacz szczegóły →
        </Link>
      </div>
    </article>
  )
}
