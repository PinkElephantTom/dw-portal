import Link from 'next/link'
import { extractYear } from '@/lib/utils'
import SearchForm from '@/components/SearchForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Szukaj w kalendarium',
}

interface DwEvent {
  id: number
  description: string
  event_date: string
}

interface Props {
  searchParams: Promise<{ q?: string }>
}

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams
  const query = params.q?.trim() || ''

  let results: DwEvent[] = []

  if (query.length >= 3) {
    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()

      const { data, error } = await supabase
        .from('dw_events')
        .select('id, description, event_date')
        .ilike('description', `%${query}%`)
        .order('event_date', { ascending: true })
        .limit(50)

      if (!error && data) {
        results = data as DwEvent[]
      }
    } catch {
      // Supabase not configured
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="font-heading text-2xl font-bold uppercase tracking-wider text-[#1d1d1b] mb-6">
        Szukaj w kalendarium
      </h1>

      {/* Search form */}
      <SearchForm initialQuery={query} />

      {/* Results */}
      {query.length >= 3 && (
        <div className="mt-6">
          <p className="text-sm text-gray-500 mb-4">
            {results.length > 0
              ? `Znaleziono ${results.length} ${results.length === 1 ? 'wydarzenie' : results.length < 5 ? 'wydarzenia' : 'wydarzeń'} dla „${query}"`
              : `Brak wyników dla „${query}"`
            }
          </p>

          <div className="space-y-3">
            {results.map((event) => {
              const year = extractYear(event.event_date)
              const dateMatch = event.event_date.match(/-(\d{2}-\d{2})$/)
              const mmdd = dateMatch ? dateMatch[1] : null

              return (
                <Link
                  key={event.id}
                  href={`/wydarzenie/${event.id}`}
                  className="block bg-white rounded-sm border border-gray-200 p-4 hover:border-[#b50926] transition-colors group"
                >
                  <div className="flex gap-3 items-start">
                    {year && (
                      <span className="shrink-0 font-heading text-xl font-bold text-[#b50926]">
                        {year}
                      </span>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 line-clamp-3 group-hover:text-[#b50926] transition-colors">
                        {event.description}
                      </p>
                      {mmdd && (
                        <p className="text-xs text-gray-400 mt-1">
                          {mmdd.replace('-', '.')}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {query.length > 0 && query.length < 3 && (
        <p className="mt-4 text-sm text-gray-400">
          Wpisz co najmniej 3 znaki, aby wyszukać.
        </p>
      )}
    </div>
  )
}
