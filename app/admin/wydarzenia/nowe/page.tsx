'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createEvent } from '@/app/admin/actions'
import { ArrowLeft, Save, CheckCircle, Pencil } from 'lucide-react'
import PhotoManager from '@/components/admin/PhotoManager'

export default function NewEventPage() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [createdEventId, setCreatedEventId] = useState<number | null>(null)

  async function handleSubmit(formData: FormData) {
    setError('')
    setLoading(true)
    const result = await createEvent(formData)
    setLoading(false)

    if (result?.error) {
      setError(result.error)
    } else if (result?.id) {
      setCreatedEventId(result.id)
    }
  }

  // After event creation — show success + photo manager
  if (createdEventId) {
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
          <h1 className="font-heading text-2xl font-bold text-[#1d1d1b]">Nowe wydarzenie</h1>
        </div>

        {/* Success message */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <CheckCircle size={20} className="text-green-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-green-800">Wydarzenie zostało utworzone.</p>
            <p className="text-sm text-green-600 mt-1">Teraz możesz dodać zdjęcia do tego wydarzenia.</p>
          </div>
        </div>

        {/* Photo management */}
        <div className="mb-6">
          <h2 className="font-heading text-lg font-bold text-[#1d1d1b] mb-4 border-b border-gray-200 pb-2">
            Zdjęcia
          </h2>
          <PhotoManager eventId={createdEventId} photos={[]} />
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          <Link
            href={`/admin/wydarzenia/${createdEventId}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#b50926] hover:bg-[#8f071e] text-white text-xs font-heading font-semibold uppercase tracking-wider rounded-md transition-colors"
          >
            <Pencil size={14} />
            Edytuj wydarzenie
          </Link>
          <Link
            href="/admin/wydarzenia"
            className="inline-flex items-center px-4 py-2.5 text-xs font-heading font-semibold uppercase tracking-wider text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Wróć do listy
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link
          href="/admin/wydarzenia"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#b50926] transition-colors mb-3"
        >
          <ArrowLeft size={14} />
          Powrót do listy
        </Link>
        <h1 className="font-heading text-2xl font-bold text-[#1d1d1b]">Nowe wydarzenie</h1>
      </div>

      <form action={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <div>
          <label htmlFor="event_date" className="block text-sm font-medium text-gray-700 mb-1">
            Data wydarzenia
          </label>
          <input
            id="event_date"
            name="event_date"
            type="date"
            required
            className="w-full sm:w-52 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#b50926] focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Opis wydarzenia
          </label>
          <textarea
            id="description"
            name="description"
            required
            rows={6}
            minLength={10}
            placeholder="Opis wydarzenia historycznego (min. 10 znaków)..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#b50926] focus:border-transparent resize-y"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#b50926] hover:bg-[#8f071e] disabled:bg-gray-400 text-white text-xs font-heading font-semibold uppercase tracking-wider rounded-md transition-colors"
          >
            <Save size={16} />
            {loading ? 'Zapisywanie...' : 'Zapisz wydarzenie'}
          </button>
          <Link
            href="/admin/wydarzenia"
            className="inline-flex items-center px-4 py-2.5 text-xs font-heading font-semibold uppercase tracking-wider text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Anuluj
          </Link>
        </div>
      </form>
    </div>
  )
}
