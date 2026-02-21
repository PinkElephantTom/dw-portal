import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Calendar, Image, AlertCircle, Plus, Clock } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard — Admin',
}

export default async function AdminDashboard() {
  const supabase = await createClient()

  // Fetch stats in parallel
  const [eventsCount, photosCount, noPhotosCount, recentEvents] = await Promise.all([
    supabase.from('dw_events').select('id', { count: 'exact', head: true }),
    supabase.from('dw_photos').select('id', { count: 'exact', head: true }),
    supabase.rpc('count_events_without_photos').then((r: { data: number | null }) => r.data),
    supabase
      .from('dw_events')
      .select('id, description, event_date, updated_at')
      .order('updated_at', { ascending: false })
      .limit(10),
  ])

  const stats = [
    {
      label: 'Wydarzenia',
      value: eventsCount.count ?? '—',
      icon: Calendar,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      label: 'Zdjęcia',
      value: photosCount.count ?? '—',
      icon: Image,
      color: 'text-green-600 bg-green-50',
    },
    {
      label: 'Bez zdjęć',
      value: noPhotosCount ?? '—',
      icon: AlertCircle,
      color: 'text-amber-600 bg-amber-50',
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-bold text-[#1d1d1b]">Dashboard</h1>
        <Link
          href="/admin/wydarzenia/nowe"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#b50926] hover:bg-[#8f071e] text-white text-xs font-heading font-semibold uppercase tracking-wider rounded-md transition-colors"
        >
          <Plus size={16} />
          Dodaj wydarzenie
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="bg-white border border-gray-200 rounded-lg p-5">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg ${stat.color}`}>
                  <Icon size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Recently updated events */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center gap-2">
          <Clock size={16} className="text-gray-400" />
          <h2 className="font-heading text-sm font-bold uppercase tracking-wider text-[#1d1d1b]">
            Ostatnio zmienione
          </h2>
        </div>
        <div className="divide-y divide-gray-100">
          {recentEvents.data?.map((event: { id: number; description: string; event_date: string; updated_at: string }) => (
            <Link
              key={event.id}
              href={`/admin/wydarzenia/${event.id}`}
              className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors"
            >
              <span className="text-xs text-gray-400 font-mono w-12 shrink-0">#{event.id}</span>
              <span className="text-xs text-gray-500 font-mono w-24 shrink-0">{event.event_date}</span>
              <span className="text-sm text-gray-800 truncate flex-1">{event.description}</span>
            </Link>
          ))}
          {(!recentEvents.data || recentEvents.data.length === 0) && (
            <p className="px-5 py-6 text-sm text-gray-400 text-center">Brak wydarzeń.</p>
          )}
        </div>
      </div>
    </div>
  )
}
