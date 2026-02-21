'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { deleteEvent } from '@/app/admin/actions'

interface Props {
  eventId: number
}

export default function DeleteEventButton({ eventId }: Props) {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    const result = await deleteEvent(eventId)
    if (result?.error) {
      alert(result.error)
      setLoading(false)
      setConfirming(false)
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={handleDelete}
          disabled={loading}
          className="px-2.5 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-400 rounded transition-colors"
        >
          {loading ? '...' : 'Tak'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
        >
          Nie
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded transition-colors"
    >
      <Trash2 size={12} />
      Usuń
    </button>
  )
}
