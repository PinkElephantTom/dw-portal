'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { addPhoto, deletePhoto } from '@/app/admin/actions'
import { Plus, Trash2, Image as ImageIcon } from 'lucide-react'

interface Photo {
  id: number
  url: string
  title: string | null
  author: string | null
  source: string | null
}

interface Props {
  eventId: number
  photos: Photo[]
}

export default function PhotoManager({ eventId, photos }: Props) {
  const router = useRouter()
  const [showAddForm, setShowAddForm] = useState(false)
  const [addError, setAddError] = useState('')
  const [addLoading, setAddLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

  async function handleAdd(formData: FormData) {
    setAddError('')
    setAddLoading(true)
    formData.set('event_id', String(eventId))

    const result = await addPhoto(formData)
    setAddLoading(false)

    if (result?.error) {
      setAddError(result.error)
    } else {
      setShowAddForm(false)
      setAddError('')
      router.refresh()
    }
  }

  async function handleDelete(photoId: number) {
    setDeletingId(photoId)
    const result = await deletePhoto(photoId, eventId)
    setDeletingId(null)
    setConfirmDeleteId(null)
    if (result?.error) {
      alert(result.error)
    } else {
      router.refresh()
    }
  }

  return (
    <div>
      {/* Photo list */}
      {photos.length > 0 ? (
        <div className="space-y-3 mb-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="flex items-start gap-3 bg-white border border-gray-200 rounded-lg p-3"
            >
              {/* Thumbnail */}
              <div className="w-20 h-20 shrink-0 bg-gray-100 rounded overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt={photo.title || ''}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 text-sm">
                <p className="text-gray-800 truncate font-medium">
                  {photo.title || 'Bez tytułu'}
                </p>
                <p className="text-gray-400 text-xs truncate mt-0.5">{photo.url}</p>
                {photo.author && (
                  <p className="text-gray-500 text-xs mt-1">Autor: {photo.author}</p>
                )}
                {photo.source && (
                  <p className="text-gray-500 text-xs">Źródło: {photo.source}</p>
                )}
              </div>

              {/* Delete */}
              <div className="shrink-0">
                {confirmDeleteId === photo.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDelete(photo.id)}
                      disabled={deletingId === photo.id}
                      className="px-2 py-1 text-xs text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-400 rounded transition-colors"
                    >
                      {deletingId === photo.id ? '...' : 'Tak'}
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-2 py-1 text-xs text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                    >
                      Nie
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(photo.id)}
                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Usuń zdjęcie"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-8 text-center mb-4">
          <ImageIcon size={32} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-gray-400">Brak zdjęć dla tego wydarzenia.</p>
        </div>
      )}

      {/* Add photo form */}
      {showAddForm ? (
        <form
          action={handleAdd}
          className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3"
        >
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
              URL zdjęcia *
            </label>
            <input
              id="url"
              name="url"
              type="url"
              required
              placeholder="https://d-w.pl/upload/..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#b50926] focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Tytuł
              </label>
              <input
                id="title"
                name="title"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#b50926] focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-1">
                Autor
              </label>
              <input
                id="author"
                name="author"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#b50926] focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="source" className="block text-sm font-medium text-gray-700 mb-1">
                Źródło
              </label>
              <input
                id="source"
                name="source"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#b50926] focus:border-transparent"
              />
            </div>
          </div>

          {addError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {addError}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={addLoading}
              className="inline-flex items-center gap-2 px-3 py-2 bg-[#b50926] hover:bg-[#8f071e] disabled:bg-gray-400 text-white text-xs font-heading font-semibold uppercase tracking-wider rounded-md transition-colors"
            >
              {addLoading ? 'Dodawanie...' : 'Dodaj zdjęcie'}
            </button>
            <button
              type="button"
              onClick={() => { setShowAddForm(false); setAddError('') }}
              className="px-3 py-2 text-xs font-heading font-semibold uppercase tracking-wider text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Anuluj
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center gap-2 px-3 py-2 text-xs font-heading font-semibold uppercase tracking-wider text-[#b50926] border border-[#b50926] hover:bg-[#b50926] hover:text-white rounded-md transition-colors"
        >
          <Plus size={14} />
          Dodaj zdjęcie
        </button>
      )}
    </div>
  )
}
