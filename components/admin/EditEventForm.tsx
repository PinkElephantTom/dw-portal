'use client'

import { useState } from 'react'
import { updateEvent } from '@/app/admin/actions'
import { Save } from 'lucide-react'

interface Props {
  eventId: number
  initialDate: string
  initialDescription: string
}

export default function EditEventForm({ eventId, initialDate, initialDescription }: Props) {
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setError('')
    setSuccess(false)
    setLoading(true)

    const result = await updateEvent(eventId, formData)
    setLoading(false)

    if (result?.error) {
      setError(result.error)
    } else {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }
  }

  return (
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
          defaultValue={initialDate}
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
          defaultValue={initialDescription}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#b50926] focus:border-transparent resize-y"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      {success && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
          Zapisano pomyślnie.
        </p>
      )}

      <div className="pt-2">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#b50926] hover:bg-[#8f071e] disabled:bg-gray-400 text-white text-xs font-heading font-semibold uppercase tracking-wider rounded-md transition-colors"
        >
          <Save size={16} />
          {loading ? 'Zapisywanie...' : 'Zapisz zmiany'}
        </button>
      </div>
    </form>
  )
}
