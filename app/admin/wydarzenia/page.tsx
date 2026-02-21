import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Plus, Pencil, ChevronLeft, ChevronRight } from 'lucide-react'
import DeleteEventButton from '@/components/admin/DeleteEventButton'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Wydarzenia — Admin',
}

const PAGE_SIZE = 50

interface Props {
  searchParams: Promise<{ page?: string; q?: string }>
}

export default async function EventsListPage({ searchParams }: Props) {
  const params = await searchParams
  const page = Math.max(1, Number(params.page) || 1)
  const query = params.q?.trim() || ''
  const offset = (page - 1) * PAGE_SIZE

  const supabase = await createClient()

  // Build query
  let dbQuery = supabase
    .from('dw_events')
    .select('id, description, event_date, photos:dw_photos(id)', { count: 'exact' })

  if (query.length >= 2) {
    dbQuery = dbQuery.ilike('description', `%${query}%`)
  }

  const { data: events, count, error } = await dbQuery
    .order('id', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  const totalPages = Math.ceil((count || 0) / PAGE_SIZE)

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-[#1d1d1b]">Wydarzenia</h1>
          <p className="text-sm text-gray-500 mt-1">
            {count != null ? `Łącznie: ${count}` : ''}
          </p>
        </div>
        <Link
          href="/admin/wydarzenia/nowe"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#b50926] hover:bg-[#8f071e] text-white text-xs font-heading font-semibold uppercase tracking-wider rounded-md transition-colors"
        >
          <Plus size={16} />
          Dodaj wydarzenie
        </Link>
      </div>

      {/* Search */}
      <form className="mb-4">
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="Szukaj po opisie..."
          className="w-full sm:w-80 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#b50926] focus:border-transparent"
        />
      </form>

      {/* Table */}
      {error ? (
        <p className="text-red-600 text-sm">Błąd: {error.message}</p>
      ) : (
        <>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 w-20">ID</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 w-28">Data</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Opis</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-500 w-20">Zdjęcia</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500 w-32">Akcje</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {events?.map((event) => (
                    <tr key={event.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-400 font-mono text-xs">{event.id}</td>
                      <td className="px-4 py-3 text-gray-700 font-mono text-xs whitespace-nowrap">
                        {event.event_date}
                      </td>
                      <td className="px-4 py-3 text-gray-800 max-w-md">
                        <p className="line-clamp-2">{event.description}</p>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-500">
                        {Array.isArray(event.photos) ? event.photos.length : 0}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/wydarzenia/${event.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                          >
                            <Pencil size={12} />
                            Edytuj
                          </Link>
                          <DeleteEventButton eventId={event.id} />
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(!events || events.length === 0) && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                        Brak wydarzeń.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-500">
                Strona {page} z {totalPages}
              </p>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link
                    href={`/admin/wydarzenia?page=${page - 1}${query ? `&q=${encodeURIComponent(query)}` : ''}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    <ChevronLeft size={14} />
                    Poprzednia
                  </Link>
                )}
                {page < totalPages && (
                  <Link
                    href={`/admin/wydarzenia?page=${page + 1}${query ? `&q=${encodeURIComponent(query)}` : ''}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    Następna
                    <ChevronRight size={14} />
                  </Link>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
